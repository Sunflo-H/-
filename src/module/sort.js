// * 정렬버튼

/**
 * ^ 정렬 버튼을 클릭 가능한 상태로 만드는 함수
 */
export function ableSortBtn() {
  const sortBtns = document.querySelectorAll(".sort-btn");
  const layoutBox = document.querySelector(".layout-box");

  sortBtns.forEach((btn) => {
    btn.classList.remove("disable");
  });

  layoutBox.classList.remove("disable");
}

/**
 * ^ 정렬 버튼을 클릭 불가능한 상태로 만드는 함수
 */
export function disableSortBtn() {
  const sortBtns = document.querySelectorAll(".sort-btn");
  const layoutBox = document.querySelector(".layout-box");

  sortBtns.forEach((btn) => {
    btn.classList.add("disable");
  });

  layoutBox.classList.add("disable");
}
