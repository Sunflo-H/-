const search = document.querySelector(".search");
const searchInput = search.querySelector(".search__input");
const searchEx = search.querySelector(".search__list");
const searchExItem = searchEx.querySelectorAll(".search__list__item");
const nav = document.querySelector(".nav");
const navbox = document.querySelector(".nav__item-box");
const navItems = nav.querySelectorAll(".nav__item");

const searchIcon = search.querySelector(".search__label");

searchInput.addEventListener("click", (e) => {
  search.classList.add("active");
  if (searchInput.value !== "") searchEx.classList.add("active");
});

searchInput.addEventListener("keyup", (e) => {
  searchEx.classList.add("active");
});

document.addEventListener("click", (e) => {
  if (
    e.target !== search &&
    e.target !== searchInput &&
    e.target !== searchEx
  ) {
    search.classList.remove("active");
    searchEx.classList.remove("active");
  }
});

navItems.forEach((item, index) => {
  item.addEventListener("click", (e) => {
    for (let i = 0; i < navItems.length; i++) {
      if (index === i) navItems[i].classList.add("active");
      else navItems[i].classList.remove("active");

      /**
       * 클릭한 item의 인덱스랑 값이 같은 navItem[i]에는 active 추가
       * 나머지는 active 제거
       */
    }
  });
});
