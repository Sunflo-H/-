const contextMenuWrapper = document.querySelector(".context-menu-box");
const li = document.querySelectorAll(".context-menu__item");
const contextMenu = document.querySelector(".context-menu");

// 메뉴의 개수에 따른 각도
let option = {
  six: 60,
  eight: 45,
};

function hideMenu() {
  li.forEach((item, index) => {
    item.style.opacity = 1;
    item.style.transform = `rotate(0deg) translate(0px)`;
  });
  contextMenuWrapper.style.opacity = 0;
  contextMenu.style.opacity = 0;
}

function rightClick(e) {
  e.preventDefault();
  if (contextMenuWrapper.style.opacity == 1) {
    hideMenu();
  } else {
    contextMenuWrapper.style.opacity = 1;
    contextMenuWrapper.style.left = e.pageX - 25 + "px";
    contextMenuWrapper.style.top = e.pageY - 40 - 70 + "px";
    contextMenu.style.opacity = 1;

    console.log(contextMenuWrapper.style.top);
    console.log(e);
    li.forEach((item, index) => {
      const cover = item.querySelector(".context-menu_cover");
      item.style.opacity = 1;

      // 클릭 지점에서부터 메뉴의 거리와 각도를 조절
      item.style.transform = `rotate(${
        index * option.eight
      }deg) translate(-80px)`;

      // 달라진 메뉴의 각도만큼 안의 컨텐츠의 각도를 반대로 돌려 정상각도로 만듬
      cover.style.transform = `rotate(-${index * option.eight}deg)`;
    });
  }
}

document.addEventListener("click", (e) => {
  hideMenu();
});

document.addEventListener("contextmenu", (e) => {
  rightClick(e);
});
