const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// Allowed item types (must match client ITEM_CATALOG keys)
const VALID_ITEMS = new Set([
  "herb_seed","carrot_seed","onion_seed","potato_seed","tomato_seed","wheat_seed",
  "herbs","carrot","onion","potato","tomato","wheat","barley","grapes","figs","olives","pomegranates","dates",
  "mushrooms","berries","eggs","milk","honey","wool","feed",
  "olive_oil","lamp_oil","flour","barley_flour","dried_figs","dried_dates","raisins",
  "flatbread","vegetable_soup","bread","roasted_vegetables","stew","honey_cake","fruit_salad",
]);

// ── CREATE MARKET LISTING ──
// Validates seller has items, deducts from inventory, creates listing
exports.createMarketListing = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in");
  const uid = request.auth.uid;
  const { itemType, quantity, pricePerUnit } = request.data;

  if (!VALID_ITEMS.has(itemType)) throw new HttpsError("invalid-argument", "Invalid item type");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new HttpsError("invalid-argument", "Invalid quantity");
  if (!Number.isInteger(pricePerUnit) || pricePerUnit < 1 || pricePerUnit > 9999) throw new HttpsError("invalid-argument", "Invalid price");

  const userRef = db.collection("users").doc(uid);
  const profileRef = db.collection("userProfiles").doc(uid);

  return db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) throw new HttpsError("not-found", "User not found");
    const userData = userDoc.data();
    const inv = userData.inventory || {};
    if ((inv[itemType] || 0) < quantity) throw new HttpsError("failed-precondition", "Not enough items");

    // Get seller name
    const profileDoc = await tx.get(profileRef);
    const sellerName = profileDoc.exists ? (profileDoc.data().username || "Anonymous") : "Anonymous";

    // Deduct from inventory
    inv[itemType] = (inv[itemType] || 0) - quantity;
    if (inv[itemType] <= 0) delete inv[itemType];
    tx.update(userRef, { inventory: inv });

    // Create listing
    const listingRef = db.collection("marketListings").doc();
    tx.set(listingRef, {
      sellerId: uid,
      sellerName,
      itemType,
      quantity,
      pricePerUnit,
      totalPrice: quantity * pricePerUnit,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "active",
    });

    return { success: true, listingId: listingRef.id };
  });
});

// ── PURCHASE MARKET LISTING ──
// Validates buyer has coins, transfers coins and items atomically
exports.purchaseMarketListing = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in");
  const uid = request.auth.uid;
  const { listingId } = request.data;

  if (!listingId) throw new HttpsError("invalid-argument", "Missing listingId");

  const listingRef = db.collection("marketListings").doc(listingId);

  return db.runTransaction(async (tx) => {
    const listingDoc = await tx.get(listingRef);
    if (!listingDoc.exists) throw new HttpsError("not-found", "Listing not found");
    const listing = listingDoc.data();

    if (listing.status !== "active") throw new HttpsError("failed-precondition", "Listing no longer active");
    if (listing.expiresAt && listing.expiresAt.toDate() < new Date()) throw new HttpsError("failed-precondition", "Listing expired");
    if (listing.sellerId === uid) throw new HttpsError("failed-precondition", "Cannot buy your own listing");

    // Check buyer has coins
    const buyerRef = db.collection("users").doc(uid);
    const buyerDoc = await tx.get(buyerRef);
    if (!buyerDoc.exists) throw new HttpsError("not-found", "Buyer not found");
    const buyerData = buyerDoc.data();
    const buyerBank = buyerData.bank || { coins: 0, diamonds: 0 };
    if (buyerBank.coins < listing.totalPrice) throw new HttpsError("failed-precondition", "Not enough coins");

    // Check seller exists
    const sellerRef = db.collection("users").doc(listing.sellerId);
    const sellerDoc = await tx.get(sellerRef);
    if (!sellerDoc.exists) throw new HttpsError("not-found", "Seller not found");
    const sellerData = sellerDoc.data();
    const sellerBank = sellerData.bank || { coins: 0, diamonds: 0 };

    // Transfer coins: buyer pays, seller receives
    buyerBank.coins -= listing.totalPrice;
    sellerBank.coins += listing.totalPrice;
    tx.update(buyerRef, { bank: buyerBank });
    tx.update(sellerRef, { bank: sellerBank });

    // Transfer items to buyer
    const buyerInv = buyerData.inventory || {};
    buyerInv[listing.itemType] = (buyerInv[listing.itemType] || 0) + listing.quantity;
    tx.update(buyerRef, { inventory: buyerInv });

    // Mark listing as sold
    tx.update(listingRef, {
      status: "sold",
      buyerId: uid,
      soldAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      itemType: listing.itemType,
      quantity: listing.quantity,
      totalPrice: listing.totalPrice,
      newCoins: buyerBank.coins,
    };
  });
});

// ── CANCEL MARKET LISTING ──
// Returns items to seller, marks listing cancelled
exports.cancelMarketListing = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in");
  const uid = request.auth.uid;
  const { listingId } = request.data;

  if (!listingId) throw new HttpsError("invalid-argument", "Missing listingId");

  const listingRef = db.collection("marketListings").doc(listingId);

  return db.runTransaction(async (tx) => {
    const listingDoc = await tx.get(listingRef);
    if (!listingDoc.exists) throw new HttpsError("not-found", "Listing not found");
    const listing = listingDoc.data();

    if (listing.sellerId !== uid) throw new HttpsError("permission-denied", "Not your listing");
    if (listing.status !== "active") throw new HttpsError("failed-precondition", "Listing not active");

    // Return items to seller
    const userRef = db.collection("users").doc(uid);
    const userDoc = await tx.get(userRef);
    const userData = userDoc.exists ? userDoc.data() : {};
    const inv = userData.inventory || {};
    inv[listing.itemType] = (inv[listing.itemType] || 0) + listing.quantity;
    tx.update(userRef, { inventory: inv });

    // Mark cancelled
    tx.update(listingRef, { status: "cancelled" });

    return { success: true, itemType: listing.itemType, quantity: listing.quantity };
  });
});

// ── PRAY FOR REQUEST ──
// Increments prayer count, prevents double-praying, awards candles
exports.prayForRequest = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in");
  const uid = request.auth.uid;
  const { requestId } = request.data;

  if (!requestId) throw new HttpsError("invalid-argument", "Missing requestId");

  const prayerRef = db.collection("prayerRequests").doc(requestId);
  const prayedRef = prayerRef.collection("prayers").doc(uid);

  return db.runTransaction(async (tx) => {
    const prayerDoc = await tx.get(prayerRef);
    if (!prayerDoc.exists) throw new HttpsError("not-found", "Prayer request not found");
    const prayer = prayerDoc.data();

    // Check not already prayed
    const prayedDoc = await tx.get(prayedRef);
    if (prayedDoc.exists) throw new HttpsError("already-exists", "Already prayed for this request");

    // Cannot pray for own request
    if (prayer.userId === uid) throw new HttpsError("failed-precondition", "Cannot pray for your own request");

    // Record that this user prayed
    tx.set(prayedRef, { prayedAt: FieldValue.serverTimestamp() });

    // Increment prayer count
    const newCount = (prayer.prayedCount || 0) + 1;
    tx.update(prayerRef, { prayedCount: newCount });

    // Award candles: +2 to person praying, +1 to prayer author
    const prayerUserRef = db.collection("users").doc(uid);
    const authorUserRef = db.collection("users").doc(prayer.userId);

    const prayerUserDoc = await tx.get(prayerUserRef);
    const authorUserDoc = await tx.get(authorUserRef);

    if (prayerUserDoc.exists) {
      const candles = (prayerUserDoc.data().candles || 0) + 2;
      tx.update(prayerUserRef, { candles });
    }
    if (authorUserDoc.exists) {
      const candles = (authorUserDoc.data().candles || 0) + 1;
      tx.update(authorUserRef, { candles });
    }

    return { success: true, newCount };
  });
});

// ── CONTRIBUTE TO EVENT ──
// Validates inventory, deducts items, updates community progress
exports.contributeToEvent = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in");
  const uid = request.auth.uid;
  const { eventId, itemType, quantity } = request.data;

  if (!eventId || !itemType || !quantity) throw new HttpsError("invalid-argument", "Missing fields");
  if (!VALID_ITEMS.has(itemType)) throw new HttpsError("invalid-argument", "Invalid item type");
  if (!Number.isInteger(quantity) || quantity < 1) throw new HttpsError("invalid-argument", "Invalid quantity");

  const eventRef = db.collection("communityEvents").doc(eventId);
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const eventDoc = await tx.get(eventRef);
    if (!eventDoc.exists) throw new HttpsError("not-found", "Event not found");
    const event = eventDoc.data();

    if (event.status !== "active") throw new HttpsError("failed-precondition", "Event not active");
    if (event.endDate && event.endDate.toDate() < new Date()) throw new HttpsError("failed-precondition", "Event ended");
    if (event.goalType !== itemType) throw new HttpsError("invalid-argument", "Wrong item type for this event");

    // Check user inventory
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) throw new HttpsError("not-found", "User not found");
    const userData = userDoc.data();
    const inv = userData.inventory || {};
    if ((inv[itemType] || 0) < quantity) throw new HttpsError("failed-precondition", "Not enough items");

    // Deduct items
    inv[itemType] = (inv[itemType] || 0) - quantity;
    if (inv[itemType] <= 0) delete inv[itemType];
    tx.update(userRef, { inventory: inv });

    // Update event progress
    const newProgress = (event.currentProgress || 0) + quantity;
    const completed = newProgress >= event.goalAmount;
    tx.update(eventRef, {
      currentProgress: newProgress,
      ...(completed ? { status: "completed" } : {}),
    });

    return { success: true, newProgress, completed };
  });
});
