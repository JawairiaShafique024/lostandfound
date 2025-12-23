# Device Toolbar Kahan Hai? 📱

## Inspect Panel Mein Device Toolbar Find Karne ka Tareeqa

### **Option 1: Top Bar Mein Icon (Sabse Aasaan)**

Screenshot jaisa inspect panel khula hai? Ab:

1. **Top bar dekho** (inspect panel ke sabse upar)
2. **Mobile/Tablet icon** dhundho - ye ek mobile phone ya tablet shape ka icon hota hai
3. Ya **Toggle device toolbar** button - rectangle shape mein ek device icon

**Location:**
```
[Elements] [Console] [Sources] [Network] ... [>>]  👈 Yeh tabs hain
                                                      👇 Iske neeche
[Mobile Icon 📱]  👈 YAHAN HAI! Click karo!
```

### **Option 2: Keyboard Shortcut (Instant)**

1. Inspect panel mein **kisi bhi tab par ho**
2. **`Ctrl+Shift+M`** press karo (Windows/Linux)
   - Ya **`Cmd+Shift+M`** (Mac)
3. Device toolbar automatically enable ho jayega!

### **Option 3: Menu se**

1. Inspect panel ke **top-right corner** mein 3 dots (**⋮**) dhundho
2. Click karo
3. Menu mein **"Toggle device toolbar"** ya **"Device Mode"** select karo

### **Option 4: View Menu se**

1. Browser ke **top menu bar** par
2. **View** → **Developer** → **Toggle Device Toolbar**

---

## Device Toolbar Enable Hone Ke Baad Kya Dikhega?

Once enable ho jaye, top par ek **black toolbar** dikhega jisme:
- 📱 Device dropdown (left side)
- 📐 Screen dimensions (width x height)
- 🔄 Rotation button
- 📷 Screenshot button
- ⚙️ Settings (3 dots)

---

## Agar Device Toolbar Nahin Dikha?

**Check karo:**
1. ✅ Inspect panel properly open hai?
2. ✅ Top bar visible hai?
3. ✅ Keyboard shortcut try karo: `Ctrl+Shift+M`

**Agar phir bhi nahi dikha:**
1. Inspect panel **close** karo (`F12`)
2. **Refresh** karo page (`F5`)
3. Phir se **Inspect** karo (`F12`)
4. Keyboard shortcut try karo: `Ctrl+Shift+M`

---

## Visual Guide:

```
┌─────────────────────────────────────────┐
│  Chrome Browser                         │
├─────────────────────────────────────────┤
│  [Elements] [Console] [Sources] ...     │ ← Tabs
│  📱 [Device Icon]                       │ ← YAHAN CLICK!
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │  📱 [Device Dropdown ▼]  [360x800]│  │ ← Device Toolbar (enable hone ke baad)
│  └──────────────────────────────────┘  │
│                                         │
│  HTML Structure...                     │
│                                         │
│  CSS Styles...                          │
└─────────────────────────────────────────┘
```

---

## Quick Test:

1. **F12** press karo
2. **Ctrl+Shift+M** press karo
3. **Top par black bar** dikhna chahiye with device dropdown
4. **Device dropdown** se iPhone ya koi mobile select karo
5. ✅ Website ab mobile view mein dikhni chahiye!

---

**Tip**: Agar icon nahi dikh raha, keyboard shortcut use karo - `Ctrl+Shift+M` har jagah kaam karta hai! 🎯

