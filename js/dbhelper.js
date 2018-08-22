/**
 * Common database helper functions.
 */
class DBHelper {

  static get IdbPromise() {
    return idb.open('restaurants-review', 1, upgradeDb => {
      let store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      let reviewStore = upgradeDb.createObjectStore('reviews', {
        keyPath: 'id'
      }).createIndex('restaurant_id', 'restaurant_id');
    });
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_URL_REVIEWS() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/?restaurant_id=`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
    let idbPromise = DBHelper.IdbPromise;

    idbPromise.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    }).then(restaurants => {
      if (restaurants && restaurants.length) {
        callback(null, restaurants);
      }
    }).then(() => {
      fetch(DBHelper.DATABASE_URL)
        .then((response) => {
          return response.json();
        })
        .then((restaurants) => {
          idbPromise.then(db => {
            if (!db) return;
            let store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
            restaurants.forEach(restaurant => {
              store.put(restaurant);
            })
          })
          callback(null, restaurants);
        })
        .catch(error => {
          callback(error, null);
        });
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     const restaurant = restaurants.find(r => r.id == id);
    //     if (restaurant) { // Got the restaurant
    //       callback(null, restaurant);
    //     } else { // Restaurant does not exist in the database
    //       callback('Restaurant does not exist', null);
    //     }
    //   }
    // });
    let idbPromise = DBHelper.IdbPromise;

    idbPromise.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').get(+id);
    }).then(restaurant => {
      if (!restaurant) {
        fetch(`${DBHelper.DATABASE_URL}/${id}`)
          .then((response) => {
            return response.json();
          })
          .then((responseRestaurant) => {
            idbPromise.then(db => {
              let store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
              store.put(responseRestaurant);
            })
            idbPromise.then(db => {
                let restaurant_idIndex = db.transaction('reviews').objectStore('reviews').index('restaurant_id');
                return restaurant_idIndex.getAll(+id);
              })
              .then(restaurantReviews => {
                if (restaurantReviews && restaurantReviews.length) {
                  responseRestaurant.reviews = restaurantReviews;
                  callback(null, responseRestaurant);
                } else {
                  fetch(`${DBHelper.DATABASE_URL_REVIEWS}${id}`)
                    .then((reviews) => {
                      return reviews.json();
                    })
                    .then((rReviews) => {
                      responseRestaurant.reviews = rReviews;
                      callback(null, responseRestaurant);
                      idbPromise.then(db => {
                        let reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
                        rReviews.forEach(r => {
                          reviewsStore.put(r);
                        })
                      });
                    })
                }
              })
          })
          .catch(error => {
            callback(error, null);
          });
      } else {
        idbPromise.then(db => {
          let restaurant_idIndex = db.transaction('reviews').objectStore('reviews').index('restaurant_id');
          return restaurant_idIndex.getAll(+id);
        }).then((restaurantReviews) => {
          if (restaurantReviews && restaurantReviews.length) {
            restaurant.reviews = restaurantReviews;
            callback(null, restaurant);
          } else {
            fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
              .then((reviews) => {
                return reviews.json();
              })
              .then((rReviews) => {
                restaurant.reviews = rReviews;
                callback(null, restaurant);
                idbPromise.then(db => {
                  let reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
                  rReviews.forEach(r => {
                    reviewsStore.put(r);
                  })
                })
              })
          }
        })
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Index image Srcset.
   */
  static imageSrcsetForIndex(restaurant) {
    return (`${restaurant.srcset_index}`);
  }

  /**
   * Restaurant image Srcset.
   */
  static imageSrcsetForRestaurant(restaurant) {
    return (`${restaurant.srcset_restaurant}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    })
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

(function () {
  window.addEventListener("load", (event) => {
    function handleNetworkChange(event) {
      if (navigator.onLine) {
        let x = document.getElementById("snackbar");
        x.innerHTML = "You are Now Online"
        x.className = "show";
        setTimeout(function () {
          x.className = x.className.replace("show", "");
        }, 3000);

        let offlineReviews = JSON.parse(localStorage.getItem('offlineReviews'));
        if (!offlineReviews || offlineReviews.length == 0) {
          return;
        } else {

          let promises = [];

          offlineReviews.forEach(review => {
            promises.push(
              fetch('http://localhost:1337/reviews', {
                method: 'post',
                body: JSON.stringify(review)
              }).then(function (response) {
                return response.json();
              }).then(function (data) {
                console.log(data);
              })
            )
          })


          Promise.all(promises).then(() =>
            localStorage.removeItem('offlineReviews')
          );
        }

      } else {
        let x = document.getElementById("snackbar");
        x.innerHTML = "You are Now Offline"
        x.className = "show";
        setTimeout(function () {
          x.className = x.className.replace("show", "");
        }, 3000);
      }
    }
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
  });
})();