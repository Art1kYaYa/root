let tg = window.Telegram.WebApp;
tg.expand();

async function submitDelivery() {
    let nickname = document.getElementById("nickname").value;
    let items = document.getElementById("items").value;
    let coordinates = document.getElementById("coordinates").value;

    if (!nickname || !items || !coordinates) {
        alert("Пожалуйста, заполните все поля!");
        return;
    }

    let data = {
        userId: tg.initDataUnsafe.user?.id,
        nickname,
        items,
        coordinates
    };

    try {
        let response = await fetch("https://your-server.com/api/delivery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        let result = await response.json();
        alert(result.message);
        tg.close();  
    } catch (error) {
        alert("Ошибка отправки заявки!");
    }
} let tg = window.Telegram.WebApp;
tg.expand();

async function submitDelivery() {
    let nickname = document.getElementById("nickname").value;
    let items = document.getElementById("items").value;
    let coordinates = document.getElementById("coordinates").value;

    if (!nickname || !items || !coordinates) {
        alert("Пожалуйста, заполните все поля!");
        return;
    }

    let data = {
        userId: tg.initDataUnsafe.user?.id,
        nickname,
        items,
        coordinates
    };

    try {
        let response = await fetch("https://your-server.com/api/delivery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        let result = await response.json();
        alert(result.message);
        tg.close();  
    } catch (error) {
        alert("Ошибка отправки заявки!");
    }
}
