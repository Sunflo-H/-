const modalCloseBtn = document.querySelector(".modal__close-btn");
const modalController = document.querySelectorAll(
  ".modal__carousel-controller"
);

let currentIndex = 0;
let translate = 0;
const speedTime = 500;

function openModal() {
  const modal = document.querySelector(".modal-box");
  modal.style.display = "block";
}

function closeModal() {
  const modal = document.querySelector(".modal-box");
  modal.style.display = "none";
}

/**
 * ^ Modal 의 carousel 을 동적으로 생성하는 함수
 * @param {*} images
 * @param {*} index
 */
function createCarousel(images, index) {
  const screen = document.querySelector(".modal__carousel-screen");
  const carousel = document.querySelector(".modal__carousel");
  const count = document.querySelector(".modal__carousel-count");
  const total = document.querySelector(".modal__carousel-total-count");
  const imageWidth = screen.clientWidth;

  // carousel의 너비 설정
  carousel.style.width = `${images.length * imageWidth}px`;

  // 기존의 carousel 이미지들을 삭제하고 새 이미지들로 채운다.
  while (carousel.firstChild) carousel.removeChild(carousel.firstChild);
  images.forEach((image) => {
    let element = `
          <li>
            <img class="modal__carousel__image" src=${image}?w=700&h=500&q=70&a=1 />
          </li>`;
    carousel.insertAdjacentHTML("beforeend", element);
  });

  // 첫번째 이미지와 마지막 이미지를 맨 뒤, 맨 앞에 놓아 무한carousel을 만들 준비
  let firstImageClone = carousel.firstElementChild.cloneNode(true);
  let lastImageClone = carousel.lastElementChild.cloneNode(true);

  carousel.insertAdjacentElement("afterbegin", lastImageClone);
  carousel.insertAdjacentElement("beforeend", firstImageClone);

  // 현재이미지인덱스 / 총 이미지수 설정
  count.innerText = index;
  total.innerText = images.length;

  // 생성된 이미지들에 width, transision, transform 설정
  const imageList = document.querySelectorAll(".modal__carousel__image");
  imageList.forEach((image) => {
    image.style.width = `${imageWidth}px`;
  });
  currentIndex = index;
  translate = -(currentIndex * imageWidth);
  carousel.style.transition = "none";
  carousel.style.transform = `translate(${translate}px)`;
}

/**
 * ^ carousel 이미지를 이동하는 함수
 * @param {*} direction
 */
function slideMove(direction) {
  const carousel = document.querySelector(".modal__carousel");
  const imageWidth = carousel.firstElementChild.clientWidth;

  direction === "next" ? currentIndex++ : currentIndex--;
  translate = -(imageWidth * currentIndex);
  carousel.style.transform = `translate(${translate}px)`;
  carousel.style.transition = `all ${speedTime}ms ease`;
}

/**
 * ^ 클릭한 컨트롤러에 따라 carousel을 next, prev로 이동시키는 이벤트리스너
 * @param {*} e
 */
function carouselController(e) {
  const carousel = document.querySelector(".modal__carousel");
  const imageList = carousel.querySelectorAll("img");
  const imageWidth = carousel.firstElementChild.clientWidth;
  const carouselCount = document.querySelector(".modal__carousel-count");
  const target = e.currentTarget;

  if (target.classList.contains("carousel__controller--next")) {
    slideMove("next");
    carouselCount.innerText = currentIndex;

    if (currentIndex === imageList.length - 1) {
      carouselCount.innerText = 1;
      setTimeout(() => {
        currentIndex = 1;
        translate = -(imageWidth * currentIndex);
        carousel.style.transition = `none`;
        carousel.style.transform = `translate(${translate}px)`;
      }, speedTime);
    }
  } else {
    slideMove("prev");
    carouselCount.innerText = currentIndex;

    if (currentIndex === 0) {
      carouselCount.innerText = imageList.length - 2;
      setTimeout(() => {
        currentIndex = imageList.length - 2;
        translate = -(imageWidth * currentIndex);
        carousel.style.transition = `none`;
        carousel.style.transform = `translate(${translate}px)`;
      }, speedTime);
    }
  }
}

modalCloseBtn.addEventListener("click", closeModal);
modalController.forEach((controller) => {
  controller.addEventListener("click", carouselController);
});

export default {
  openModal,
  createCarousel,
};
