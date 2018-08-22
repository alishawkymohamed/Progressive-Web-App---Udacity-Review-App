(function () {
    DBHelper.fetchRestaurants((e, restaurants) => {
        if (restaurants && restaurants.length) {
            let restaurantDrp = document.getElementById('restaurant_id');
            for (let i = 0; i < restaurants.length; i++) {
                const option = document.createElement('option');
                option.innerHTML = restaurants[i].name;
                option.value = restaurants[i].id;
                restaurantDrp.append(option);
            }
        } else {
            console.log(e);
        }
    });



    document.querySelectorAll('body > main > div > div:nth-child(3) > input')[0].addEventListener('keyup', (event) => {
        let value = +event.target.value;
        if (!isNaN(value) && !(value >= 0 && value <= 5)) {
            event.target.value = "";
        }
    });


})();

function formSubmit(event) {
    let idbPromise = DBHelper.IdbPromise;
    event.stopPropagation();
    event.preventDefault();
    let restaurantDrp = document.getElementById('restaurant_id');
    let restaurant_id = restaurantDrp.options[restaurantDrp.selectedIndex].value;
    let username = (document.querySelectorAll('body > main > div > div:nth-child(2) > input')[0]).value;
    let rating = (document.querySelectorAll('body > main > div > div:nth-child(3) > input')[0]).value;
    let comment = (document.querySelectorAll('body > main > div > div:nth-child(4) > textarea')[0]).value;

    if (+restaurant_id <= 0) {
        let x = document.getElementById("snackbar");
        x.innerHTML = "'Please Select Restaurant'</b>"
        x.className = "show";
        setTimeout(function () {
            x.className = x.className.replace("show", "");
        }, 3000);
        return;
    }
    let review = {
        "restaurant_id": parseInt(restaurant_id),
        "name": username,
        "rating": parseInt(rating),
        "comments": comment
    }

    if (!navigator.onLine) {
        let offlineReviews = JSON.parse(localStorage.getItem('offlineReviews'));
        if (!offlineReviews) {
            offlineReviews = [];
            offlineReviews.push(review);
            localStorage.setItem('offlineReviews', JSON.stringify(offlineReviews));
        } else {
            offlineReviews.push(review);
            localStorage.setItem('offlineReviews', JSON.stringify(offlineReviews));
        }
        let x = document.getElementById("snackbar");
        x.innerHTML = "You are offline .. <br/>Your Comment will be submitted when you are <b>Online</b>"
        x.className = "show";
        setTimeout(function () {
            x.className = x.className.replace("show", "");
        }, 3000);
    } else {
        fetch('http://localhost:1337/reviews', {
            method: 'post',
            body: JSON.stringify(review)
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            let x = document.getElementById("snackbar");
            x.innerHTML = "Your Comment Submitted Sucessfully"
            x.className = "show";
            setTimeout(function () {
                x.className = x.className.replace("show", "");
                window.location.href = "/";
            }, 2000);
            idbPromise.then(db => {
                let store = db.transaction('reviews', 'readwrite').objectStore('reviews');
                store.put(data);
            })
        });
    }
}