const dishes = [
  // --- SOUPS (6) ---
  {
    keyword: "borsch",
    name: "Борщ",
    price: 200,
    category: "soup",
    count: "350 г",
    image: "images/soup1.jpeg",
    tags: ["meat"]
  },
  {
    keyword: "puree",
    name: "Суп-пюре",
    price: 230,
    category: "soup",
    count: "330 г",
    image: "images/soup2.jpeg",
    tags: ["veg"]
  },
  {
    keyword: "solyanka",
    name: "Солянка",
    price: 250,
    category: "soup",
    count: "350 г",
    image: "images/soup3.jpeg",
    tags: ["meat"]
  },
  {
    keyword: "ukha",
    name: "Уха по-домашнему",
    price: 260,
    category: "soup",
    count: "350 г",
    image: "images/soup4.jpg",
    tags: ["fish"]
  },
  {
    keyword: "shchi",
    name: "Щи мясные",
    price: 210,
    category: "soup",
    count: "350 г",
    image: "images/soup5.jpg",
    tags: ["meat"]
  },
  {
    keyword: "mushroom",
    name: "Грибной крем-суп",
    price: 240,
    category: "soup",
    count: "320 г",
    image: "images/soup6.jpg",
    tags: ["veg"]
  },

  // --- MAINS (6) ---
  {
    keyword: "kiev",
    name: "Котлета по-киевски",
    price: 350,
    category: "main",
    count: "250 г",
    image: "images/main1.jpeg",
    tags: ["meat"]
  },
  {
    keyword: "pilaf",
    name: "Плов с говядиной",
    price: 300,
    category: "main",
    count: "300 г",
    image: "images/main2.jpeg",
    tags: ["meat"]
  },
  {
    keyword: "pasta",
    name: "Паста с овощами",
    price: 320,
    category: "main",
    count: "280 г",
    image: "images/main3.jpeg",
    tags: ["veg"]
  },
  {
    keyword: "stroganoff",
    name: "Бефстроганов",
    price: 380,
    category: "main",
    count: "300 г",
    image: "images/main4.jpg",
    tags: ["meat"]
  },
  {
    keyword: "ratatouille",
    name: "Рататуй с овощами",
    price: 330,
    category: "main",
    count: "280 г",
    image: "images/main5.jpg",
    tags: ["veg"]
  },
  {
    keyword: "teriyaki",
    name: "Курица терияки",
    price: 360,
    category: "main",
    count: "300 г",
    image: "images/main6.jpg",
    tags: ["meat"]
  },

  // --- DRINKS (6) ---
  {
    keyword: "compote",
    name: "Компот",
    price: 90,
    category: "drink",
    count: "250 мл",
    image: "images/juice1.jpeg",
    tags: ["cold"]
  },
  {
    keyword: "morse",
    name: "Морс ягодный",
    price: 100,
    category: "drink",
    count: "250 мл",
    image: "images/juice2.jpeg",
    tags: ["cold"]
  },
  {
    keyword: "orange",
    name: "Сок апельсиновый",
    price: 120,
    category: "drink",
    count: "250 мл",
    image: "images/juice3.jpeg",
    tags: ["cold"]
  },
  {
    keyword: "tea",
    name: "Чёрный чай",
    price: 70,
    category: "drink",
    count: "200 мл",
    image: "images/drink4.jpg",
    tags: ["hot"]
  },
  {
    keyword: "coffee",
    name: "Кофе американо",
    price: 120,
    category: "drink",
    count: "200 мл",
    image: "images/drink5.jpg",
    tags: ["hot"]
  },
  {
    keyword: "water",
    name: "Минеральная вода",
    price: 60,
    category: "drink",
    count: "330 мл",
    image: "images/drink6.jpg",
    tags: ["cold"]
  },

  // --- SALADS (6) ---
  {
    keyword: "caesar",
    name: "Цезарь с курицей",
    price: 280,
    category: "salad",
    count: "200 г",
    image: "images/salad1.jpg",
    tags: ["meat"]
  },
  {
    keyword: "greek",
    name: "Греческий салат",
    price: 250,
    category: "salad",
    count: "220 г",
    image: "images/salad2.jpg",
    tags: ["veg"]
  },
  {
    keyword: "olivier",
    name: "Оливье",
    price: 200,
    category: "salad",
    count: "220 г",
    image: "images/salad3.jpg",
    tags: ["meat"]
  },
  {
    keyword: "vinaigrette",
    name: "Винегрет",
    price: 190,
    category: "salad",
    count: "200 г",
    image: "images/salad4.jpg",
    tags: ["veg"]
  },
  {
    keyword: "tuna",
    name: "Салат с тунцом",
    price: 300,
    category: "salad",
    count: "200 г",
    image: "images/salad5.jpg",
    tags: ["fish"]
  },
  {
    keyword: "caprese",
    name: "Капрезе",
    price: 320,
    category: "salad",
    count: "180 г",
    image: "images/salad6.jpg",
    tags: ["veg"]
  },

  // --- DESSERTS (6) ---
  {
    keyword: "medovik",
    name: "Медовик",
    price: 150,
    category: "dessert",
    count: "120 г",
    image: "images/dessert1.jpg",
    tags: ["creamy"]
  },
  {
    keyword: "cheesecake",
    name: "Чизкейк",
    price: 180,
    category: "dessert",
    count: "120 г",
    image: "images/dessert2.jpg",
    tags: ["creamy"]
  },
  {
    keyword: "icecream",
    name: "Мороженое",
    price: 120,
    category: "dessert",
    count: "100 г",
    image: "images/dessert3.jpg",
    tags: ["cold"]
  },
  {
    keyword: "pavlova",
    name: "Павлова",
    price: 190,
    category: "dessert",
    count: "110 г",
    image: "images/dessert4.jpg",
    tags: ["cold"]
  },
  {
    keyword: "fondant",
    name: "Шоколадный фондан",
    price: 220,
    category: "dessert",
    count: "110 г",
    image: "images/dessert5.jpg",
    tags: ["chocolate"]
  },
  {
    keyword: "fruit",
    name: "Фруктовый салат",
    price: 160,
    category: "dessert",
    count: "150 г",
    image: "images/dessert6.jpg",
    tags: ["fruit"]
  }
];
