// dishes.js
let dishes = [];

// !!! Укажите здесь ваш API-ключ (тот же, что используется в checkout.js)
const apiKey = "13e357d1-1f58-4491-91a5-427d5c6c0f59";

async function loadDishes() {
  const apiUrl = "https://edu.std-900.ist.mospolytech.ru/labs/api/dishes";
  try {
    const response = await fetch(`${apiUrl}?api_key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Ошибка при загрузке блюд: ${response.status}`);
    }

    dishes = await response.json();
    console.log("✅ Блюда успешно загружены:", dishes);

    // Если есть функция отрисовки — вызываем
    if (typeof renderAll === "function") {
      renderAll();
    } else {
      // иначе шлем событие для render.js
      document.dispatchEvent(new CustomEvent("dishesLoaded"));
    }

  } catch (error) {
    console.error("❌ Не удалось загрузить блюда:", error);
    const container = document.querySelector("main") || document.body;
    const errMsg = document.createElement("p");
    errMsg.style.color = "red";
    errMsg.textContent = "Ошибка загрузки блюд. Проверьте подключение к серверу.";
    container.appendChild(errMsg);
  }
}

// Загружаем блюда при загрузке страницы
document.addEventListener("DOMContentLoaded", loadDishes);