 const asyncHandler=(requestHandler)=>{
   return (req,res,next)=>{   // yha return isliye lagaya ki := vapis value return ya promise jo bhi, result hai return bhi to kro
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
 }

 export {asyncHandler}





//  const asyncHandler((requestHAndler)=>{ ()=>{}    })



    /*
    Bhai, **bahut sahi pakde ho!**
Ab samjhte hain ki agar **koi error nahi aata** to `asyncHandler` ka code kaise kaam karta hai — **line by line breakdown** ke saath.

---

### 🔁 Pehle `asyncHandler` ka structure dekh lo:

```js
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
               .catch((err) => next(err));
    };
};
```

---

## 🔷 Maan lo humne aise use kiya:

```js
app.get("/user/:id", asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
}));
```

Agar `User.findById()` sahi se user return kar raha hai, to kya hoga?

---

## ✅ Step-by-Step Execution (No Error Case):

### ▶️ Step 1: Request aayi — `/user/123`

### ▶️ Step 2: `asyncHandler(...)` call hua

```js
asyncHandler(requestHandler) 
// requestHandler => (req, res, next) => {...}
```

### ▶️ Step 3: Yeh return karega ek **naya middleware function**:

```js
(req, res, next) => {
    Promise.resolve(requestHandler(req, res, next))
           .catch((err) => next(err));
}
```

Yeh function Express ke middleware stack me chala jayega.

---

### ▶️ Step 4: `requestHandler` execute hoga

```js
const user = await User.findById(req.params.id);
res.status(200).json(user);
```

* Yahan koi error nahi hai to:
* `await User.findById(...)` **resolve** ho gaya.
* `res.json(user)` se response **successfully client ko chala gaya.**

---

### 🟢 `Promise.resolve(...)` ka kya role hai?

* `requestHandler(...)` ek async function hai, to woh hamesha ek **Promise** return karta hai.
* `Promise.resolve(...)` usko **safe** banata hai — agar promise resolve ho gaya to kuch nahi karega.
* Agar reject hua (error aaya), to `.catch()` chal jayega.

---

### 🔚 Final Flow (Success case):

| Step | Action                                         |
| ---- | ---------------------------------------------- |
| ✅    | Route hit hoti hai                             |
| ✅    | `asyncHandler` middleware wrap karta hai       |
| ✅    | `requestHandler` async function chalta hai     |
| ✅    | Promise resolve hota hai                       |
| ✅    | Response `res.json(...)` se chala jata hai     |
| ❌    | `.catch()` nahi chalta, kyunki error nahi aaya |

---

## 🔥 One Line Me:

> **Agar error nahi aata, to `requestHandler` ka response normal tarike se client ko chala jata hai. `asyncHandler` kuch interfere nahi karta.**

---

Agar chaaho to me tumhare liye ek full Express route ka mini example bana deta hoon — jisme success aur error dono flow dikhaye gaye ho. Batana bhai.

    
    
    */