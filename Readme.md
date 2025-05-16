 ->>>> What is Aggregation?
Aggregation is a way to process data and transform it into meaningful results — like grouping, filtering, counting, summing, joining, projecting, etc.

Think of it like a pipeline of stages, where each stage transforms the data.

It's similar to SQL's GROUP BY, JOIN, SUM, COUNT, WHERE, etc.

✅ Basic Example
Collection: Orders
json
Copy
Edit
[
  { "item": "Apple", "price": 10, "quantity": 2 },
  { "item": "Banana", "price": 5, "quantity": 10 },
  { "item": "Apple", "price": 10, "quantity": 3 },
  { "item": "Orange", "price": 8, "quantity": 5 }
]
Goal:
Find total quantity sold per item.

Aggregation Query:
javascript
Copy
Edit
const result = await Orders.aggregate([
  {
    $group: {
      _id: "$item", // group by item
      totalQuantity: { $sum: "$quantity" } // sum quantities per item
    }
  }
])
Output:
json
Copy
Edit
[
  { "_id": "Apple", "totalQuantity": 5 },
  { "_id": "Banana", "totalQuantity": 10 },
  { "_id": "Orange", "totalQuantity": 5 }
]
✅ Explanation:
Stage	What it does
$group	Groups documents by item
_id: "$item"	Makes item name as group key
$sum: "$quantity"	Adds up all quantity values for each item

✅ Real-world Example: User Collection
Let's say you have a User collection like this:

json
Copy
Edit
[
  { "username": "gopee", "country": "India" },
  { "username": "alex", "country": "USA" },
  { "username": "raj", "country": "India" }
]
Goal:
Count how many users are from each country.

Aggregation:
javascript
Copy
Edit
const usersByCountry = await User.aggregate([
  {
    $group: {
      _id: "$country",
      count: { $sum: 1 }
    }
  }
])
Output:
json
Copy
Edit
[
  { "_id": "India", "count": 2 },
  { "_id": "USA", "count": 1 }
]


