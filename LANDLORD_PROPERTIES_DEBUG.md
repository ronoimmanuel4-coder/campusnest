# Landlord Properties Not Showing - Debug Guide

## 🔍 Issue: Approved Property Not Appearing in Landlord Dashboard

### **Possible Causes:**

1. **Response Structure Mismatch**
2. **Landlord ID Mismatch**
3. **Property Not Linked to Landlord**
4. **Frontend Data Extraction Error**
5. **Backend Query Issue**

---

## 🐛 **Step-by-Step Debugging**

### **Step 1: Check Browser Console**

1. **Login as the landlord**
2. **Go to Dashboard → My Properties tab**
3. **Open Browser Console (F12)**
4. **Look for these logs:**

```javascript
=== LANDLORD USER INFO ===
Current User: { _id: "...", name: "...", role: "landlord" }
User ID: "673abc123..."
User Role: "landlord"

=== MY PROPERTIES DEBUG ===
Full Response: { data: {...}, status: 200, ... }
Response Data: { success: true, count: 1, data: { properties: [...] } }
Response Data.data: { properties: [...] }
Response Data.properties: undefined
Response Data.data.properties: [{ _id: "...", title: "..." }]

Using data.data.properties
Final Properties Data: [{ _id: "...", title: "..." }]
Properties Count: 1
```

---

### **Step 2: Verify Response Structure**

**Expected Backend Response:**
```javascript
{
  success: true,
  count: 1,
  data: {
    properties: [
      {
        _id: "6919a12b7241d0d9fb4bb22e",
        title: "Modern 2BR Apartment",
        landlord: "673abc123...",  // ← Must match user._id
        price: 15000,
        status: "active",
        // ... other fields
      }
    ]
  }
}
```

**Check Console Output:**
- If `Properties Count: 0` → Property not returned by backend
- If `Properties Count: 1+` → Frontend extraction working

---

### **Step 3: Check Landlord ID Match**

**In Console, compare:**
```javascript
User ID: "673abc123..."           // From user object
Property landlord: "673abc123..." // From property object
```

**These MUST match exactly!**

If they don't match:
- Property was created by different user
- Property needs to be reassigned

---

### **Step 4: Check Database Directly**

**Using MongoDB Compass or CLI:**

```javascript
// Find the landlord's user ID
db.users.findOne({ email: "landlord@demo.com" })
// Note the _id field

// Find properties for this landlord
db.properties.find({ landlord: ObjectId("673abc123...") })

// Check if property exists and has correct landlord
db.properties.findOne({ _id: ObjectId("6919a12b7241d0d9fb4bb22e") })
// Verify landlord field matches user _id
```

---

### **Step 5: Check Backend Logs**

**In backend terminal, look for:**
```
Get my properties error: ...
```

**Or check backend route manually:**
```bash
# In backend folder
node
> const mongoose = require('mongoose');
> mongoose.connect('your-mongodb-uri');
> const Property = require('./models/Property');
> Property.find({ landlord: 'USER_ID_HERE' }).then(console.log);
```

---

## 🔧 **Common Fixes**

### **Fix 1: Property Has Wrong Landlord ID**

**Problem:** Property's `landlord` field doesn't match logged-in user's `_id`

**Solution:** Update property in database
```javascript
// In MongoDB
db.properties.updateOne(
  { _id: ObjectId("PROPERTY_ID") },
  { $set: { landlord: ObjectId("CORRECT_LANDLORD_ID") } }
)
```

---

### **Fix 2: Response Structure Changed**

**Problem:** Backend returns different structure than expected

**Solution:** Already handled in updated code with multiple checks:
```javascript
if (propsRes.data?.data?.properties) {
  propertiesData = propsRes.data.data.properties;
} else if (propsRes.data?.properties) {
  propertiesData = propsRes.data.properties;
}
// ... etc
```

---

### **Fix 3: User Not Authenticated Properly**

**Problem:** User object missing or incorrect

**Solution:**
1. Logout and login again
2. Check token in localStorage
3. Verify token is valid
4. Check user role is "landlord"

---

### **Fix 4: Backend Route Not Working**

**Problem:** `/api/properties/my-properties` returns error

**Solution:**
1. Check backend is running
2. Check route exists in `backend/routes/properties.js`
3. Check middleware (`protect`) is working
4. Check user is authenticated

---

## 📊 **Verification Checklist**

Use this checklist to verify everything:

### **Frontend:**
- [ ] User is logged in
- [ ] User role is "landlord"
- [ ] User has `_id` field
- [ ] API call to `/api/properties/my-properties` succeeds
- [ ] Response has `data` field
- [ ] Response has properties array
- [ ] Properties array is not empty
- [ ] Properties are set in state
- [ ] Component re-renders with properties

### **Backend:**
- [ ] Backend server is running
- [ ] Route `/api/properties/my-properties` exists
- [ ] Route has `protect` middleware
- [ ] Route checks `req.user.role === 'landlord'`
- [ ] Query uses `req.user._id`
- [ ] Properties exist in database
- [ ] Properties have correct `landlord` field

### **Database:**
- [ ] Property exists in `properties` collection
- [ ] Property has `landlord` field
- [ ] `landlord` field is ObjectId
- [ ] `landlord` matches user's `_id`
- [ ] Property status is not "deleted"

---

## 🎯 **Quick Test Commands**

### **Test 1: Check User ID**
```javascript
// In browser console
console.log('User ID:', localStorage.getItem('token'));
// Decode JWT at jwt.io to see user ID
```

### **Test 2: Test API Directly**
```bash
# Get token from localStorage
# Then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/properties/my-properties
```

### **Test 3: Check Property in DB**
```javascript
// In MongoDB shell
db.properties.find({ status: "active" }).pretty()
// Check landlord field for each property
```

---

## 🔍 **What to Look For in Console**

### **Success Case:**
```
=== MY PROPERTIES DEBUG ===
Response Data: { success: true, count: 1, data: { properties: [Object] } }
Using data.data.properties
Final Properties Data: (1) [{…}]
Properties Count: 1
```

### **Empty Case (No Properties):**
```
=== MY PROPERTIES DEBUG ===
Response Data: { success: true, count: 0, data: { properties: [] } }
Using data.data.properties
Final Properties Data: []
Properties Count: 0
```

### **Error Case:**
```
Failed to load dashboard data: AxiosError {...}
Error details: { success: false, message: "..." }
```

---

## 💡 **Most Likely Issues**

### **1. Landlord ID Mismatch (80% of cases)**
**Symptom:** Backend returns empty array
**Fix:** Update property's landlord field in database

### **2. Property Not Approved (15% of cases)**
**Symptom:** Property exists but not returned
**Fix:** Admin needs to approve property (status: "active")

### **3. Response Structure (5% of cases)**
**Symptom:** Properties exist but not displayed
**Fix:** Already handled in updated code

---

## 🛠️ **Manual Fix Script**

If you need to manually fix a property's landlord:

```javascript
// In MongoDB shell or Compass

// 1. Find the landlord's user ID
const landlord = db.users.findOne({ email: "landlord@demo.com" });
console.log("Landlord ID:", landlord._id);

// 2. Find the property
const property = db.properties.findOne({ title: "Property Title" });
console.log("Current landlord:", property.landlord);

// 3. Update if needed
db.properties.updateOne(
  { _id: property._id },
  { $set: { landlord: landlord._id } }
);

// 4. Verify
db.properties.findOne({ _id: property._id });
```

---

## 📞 **Support Information**

After checking all above:

1. **Share Console Output:**
   - Copy all "=== MY PROPERTIES DEBUG ===" logs
   - Copy "=== LANDLORD USER INFO ===" logs

2. **Share Network Response:**
   - F12 → Network tab
   - Find `/api/properties/my-properties` request
   - Copy response

3. **Share Property Info:**
   - Property ID
   - Property title
   - Expected landlord email

---

## ✅ **Expected Behavior**

After fixes:

1. Landlord logs in
2. Goes to "My Properties" tab
3. Sees all their properties
4. Properties show:
   - Title, image, location
   - Price, bedrooms, bathrooms
   - Status badge
   - Views count
   - Vacancies (if any)
   - Edit and status toggle buttons

---

**Use this guide to diagnose and fix the issue!** 🔧
