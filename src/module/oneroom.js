import { getPyeong } from "./etc.js";
import modal from "./modal.js";

const sortBtns = document.querySelectorAll(".sort-btn");
const priceBtn = sortBtns[0];
const sizeBtn = sortBtns[1];
const layoutBtns = document.querySelectorAll(".layout-btn");
/**
 * - cardList의 현재 layout상태에 대한 변수
 */
let cardListLayout = "card";

/**
 * - originalRoomList는 전역에서 사용가능한 roomList이며, 정렬되지 않은 데이터, 크롤링한 데이터 원본을 의미한다.
 */
let originalRoomList = [];

/**
 * - 전역에서 현재 카드리스트에 사용되는 방 정보들을 가지고있는 배열이다.
 * - 레이아웃이 바뀔때 createRoomSection() 함수를 호출하기때문에 방 정보가 필요하다. 이때 사용된다.
 * - 정렬되었다면 정렬된 그 방 정보들을 그대로 card or list layout으로 보여줘야 하므로 필요한 배열이다.
 */
let roomListForChangeLayout = [];

/**
 * - 방의 디테일 정보들을 보여주는 element를 생성한다.
 * @param {*} roomData
 * @returns element
 */
function createDetailElement(roomData) {
  const room_type_obj = {
    "01": "분리형",
    "02": "오픈형",
    "03": "복층형",
    "04": "투룸",
    "05": "쓰리룸+",
    "06": "포룸+",
  };

  const manage_option_obj = {
    "01": "전기",
    "02": "가스",
    "03": "수도",
    "04": "인터넷",
    "05": "티비",
  };

  const options_obj = {
    "01": "에어컨",
    "02": "냉장고",
    "03": "세탁기",
    "04": "가스레인지",
    "05": "인덕션",
    "06": "전자레인지",
    "07": "책상",
    "08": "책장",
    "09": "침대",
    10: "옷장",
    11: "신발장",
    12: "싱크대",
  };

  const room = roomData.item;
  const agent = roomData.agent;

  const {
    address,
    jibunAddress,
    sales_type,
    보증금액,
    월세금액,
    manage_cost,
    manage_cost_inc,
    manage_cost_not_inc,
    images,
    title,
    description,
    전용면적_m2,
    room_type_code,
    service_type,
    bathroom_count,
    parking,
    floor_string,
    floor_all,
    movein_date,
    random_location,
    options,
  } = room;

  let roomTypeCode = room_type_obj[room_type_code];
  let floorString = `${floor_string}층`;
  if (floor_string === "옥탑방" || floor_string === "반지하")
    floorString = `${floor_string}`;

  let priceElement = `<div class="detail__price detail__text--14r detail__text--bold">${sales_type} ${보증금액}/${월세금액}</div>`;
  if (sales_type === "전세")
    priceElement = `<div class="detail__price detail__text--14r detail__text--bold">${sales_type} ${보증금액}</div>`;

  let jibunAddressElement = `<div class="detail__address detail__text--09r">${jibunAddress}</div>`;
  if (!jibunAddress)
    jibunAddressElement = `<div class="detail__address detail__text--09r"></div>`;

  let parkingElement = `<div class="detail__info-message ">
                          <i class="fa-brands fa-product-hunt detail__icon"></i>세대당 ${parking}
                        </div>`;
  if (parking === "불가능")
    parkingElement = `<div class="detail__info-message ">
                        <i class="fa-brands fa-product-hunt detail__icon"></i>${parking}
                      </div>`;

  let manageCostInc = "없음";
  if (manage_cost_inc) {
    manageCostInc = manage_cost_inc
      .split(";")
      .slice(0, -1)
      .map((item) => manage_option_obj[item])
      .join(", ");
  }
  let manageCostNotInc = "없음";
  if (manage_cost_not_inc) {
    manageCostNotInc = manage_cost_not_inc
      .split(";")
      .slice(0, -1)
      .map((item) => manage_option_obj[item])
      .join(", ");
  }

  let optionCodeList = options !== null ? options?.split(";").slice(0, -1) : [];
  let optionListElement = "";
  optionCodeList.forEach((optionCode) => {
    optionListElement += `<div class="detail__option-item">${options_obj[optionCode]}</div>`;
  });

  let element = `
      <div class="detail__header">
        <div class="detail__header__back"><i class="fa-solid fa-xmark"></i></div>
        <div class="detail__header__text">${address}</div>
      </div>
      <div class="detail__image-box">
        <div class="carousel__screen">
          <ul class="carousel">
            
          </ul>
          <div class="carousel__controller carousel__controller--prev"><i class="fa-solid fa-chevron-left"></i></div>
          <div class="carousel__controller carousel__controller--next"><i class="fa-solid fa-chevron-right"></i></div>
          <div class="carousel__count-box"><span class="carousel__count">1</span> / ${
            images.length
          }</div> 
        </div>
      </div>
      <div class="detail__basic">
        <div class="basic__top">
          ${jibunAddressElement}
          ${priceElement}
          <div class="detail__manage-cost--top detail__text--09r">관리비 ${manage_cost}만원</div>
        </div>
        <div class="detail__contour"></div>
        <div class="basic__middle">
          <div class="detail__title detail__text--09r">${title}</div>
        </div>
        <div class="detail__contour"></div>
        <div class="basic__bottom">  
          <div class="detail__info-message ">
            <i class="fa-solid fa-expand detail__icon"></i></i>전용 ${getPyeong(
              전용면적_m2
            )}평
          </div>
          <div class="detail__info-message ">
            <i class="fa-solid fa-house detail__icon"></i>${roomTypeCode} ${service_type}(욕실 ${bathroom_count}개)</div>
          ${parkingElement}
          <div class="detail__info-message ">
            <i class="fa-regular fa-building detail__icon"></i>${floorString}/${floor_all}
          </div>
          <div class="detail__info-message ">
            <i class="fa-regular fa-calendar detail__icon"></i>${movein_date}
          </div>
        </div>
      </div>
      <div class="detail__contour"></div>

      <div class="detail__manage">
        <div class="detail__text--11r detail__text--bold">관리비 : ${manage_cost}만원</div>
        <div class="detail__manage-inc detail__text--09r">포함 : ${manageCostInc}</div>
        <div class="detail__manage-not-inc detail__text--09r">
          별도 : ${manageCostNotInc}
        </div>
      </div>
      <div class="detail__contour"></div>

      <div class="detail__option-box">
        <div class="detail__option-title">옵션 정보</div>
        <div class="detail__option-item-box">
        ${optionListElement}</div>
      </div>
      <div class="detail__contour"></div>
      <div class="detail__description">
        <div class="detail__description-title">상세 설명</div>
        <pre class="detail__description-message">${description}</pre>
        <div class="view-more">더보기</div>
      </div>
      <div class="detail__contour"></div>

      <div class="detail__location">
        <div class="detail__location-title">위치</div>
        <div class="detail__address--short">${address}</div>
        <div id="detail__staticMap"></div>
      </div>
      <div class="detail__contour"></div>

      <div class="detail__realtor">
        <div class="detail__agent-box">
          <div class="agent__image-box">
            <img class="agent__image"src=${
              agent.owner.profile_url
            }?w=400&h=400&q=70&a=1 >
          </div>
          <div class="agent__realtor-name">${agent.agent_title}</div>
          <!-- <div class="agent__name">${agent.owner.owner_name}</div>-->
          <!-- <div class="agent__phone">${agent.owner.owner_phone}</div> -->
          <!-- agent-box에 hover하면 배경 검어지고, 이름과 전화번호 띄우기 -->
        </div>
        <div class="detail__realtor-description">
          <pre class="detail__realtor-description-message">${
            agent.agent_intro
          }</pre>
          <div class="view-more">더보기</div>
        </div>
      </div>`;
  return element;
}

function setEventOnDetailElement() {
  const detailBox = document.querySelector(".detail-box");

  const descriptionMessage = document.querySelector(
    ".detail__description-message"
  );
  const agentMessage = document.querySelector(
    ".detail__realtor-description-message"
  );
  const descriptionViewMore = document.querySelector(
    ".detail__description .view-more"
  );
  const agentViewMore = document.querySelector(
    ".detail__realtor-description .view-more"
  );

  const closeBtn = document.querySelector(".detail__header__back");

  // 상세정보 더보기 버튼 클릭
  descriptionViewMore.addEventListener("click", (e) => {
    descriptionMessage.style.maxHeight = "none";
    descriptionMessage.style.whiteSpace = "pre-wrap";
    descriptionViewMore.style.display = "none";
  });

  // 공인중개사 더보기 버튼 클릭
  agentViewMore.addEventListener("click", (e) => {
    agentMessage.style.maxHeight = "none";
    agentMessage.style.whiteSpace = "pre-wrap";
    agentViewMore.style.display = "none";
  });

  closeBtn.addEventListener("click", (e) => {
    activeDetailBox(false);
  });

  // 스크롤을 내렸을때 헤더에 CSS 변화를 주는 이벤트
  detailBox.addEventListener("scroll", (e) => {
    const header = document.querySelector(".detail__header");
    const text = header.querySelector(".detail__header__text");

    let currentScrollTop = e.target.scrollTop;

    if (currentScrollTop === 0) {
      header.style.backgroundColor = "transparent";
      header.style.color = "#fefefe";
      text.style.display = "none";
    } else {
      header.style.backgroundColor = "#fefefe";
      header.style.color = "black";
      text.style.display = "block";
    }
  });
}

function setCarousel(roomData) {
  // 이미지 박스 요소에 carousel 기능 적용
  const imageBox = document.querySelector(".detail__image-box");
  const carousel = document.querySelector(".carousel");
  const carouselControllers = document.querySelectorAll(
    ".carousel__controller"
  );

  let currentIndex = 0;
  let translate = 0;
  const speedTime = 500;

  // 캐러셀 생성
  createCarousel(roomData.item.images);

  // 이벤트 적용
  carousel.addEventListener("click", (e) => {
    if (e.target.classList.contains("carousel__image")) {
      modal.openModal();
      modal.createCarousel(roomData.item.images, currentIndex);
    }
  });

  imageBox.addEventListener("mouseenter", (e) => {
    carouselControllers.forEach((controller) => {
      controller.style.display = "block";
    });
  });

  imageBox.addEventListener("mouseleave", (e) => {
    carouselControllers.forEach((controller) => {
      controller.style.display = "none";
    });
  });

  carouselControllers.forEach((controller) => {
    controller.addEventListener("click", carouselControllerHandler);
  });

  // * 이 아래는 함수 선언 부분입니다.

  /**
   * ^ 디테일창의 이미지슬라이더 Element를 만드는 함수
   * @param {*} images
   */
  function createCarousel(images) {
    const detailBox = document.querySelector(".detail-box");
    const imageWidth = detailBox.clientWidth; // 285px

    carousel.style.width = `${images.length * imageWidth}px`;

    images.forEach((image) => {
      let element = `
      <li>
        <img class="carousel__image" src=${image}?w=400&h=300&q=70&a=1 />
      </li>`;
      carousel.insertAdjacentHTML("beforeend", element);
    });

    let firstImageClone = carousel.firstElementChild.cloneNode(true);
    let lastImageClone = carousel.lastElementChild.cloneNode(true);

    carousel.insertAdjacentElement("afterbegin", lastImageClone);
    carousel.insertAdjacentElement("beforeend", firstImageClone);

    currentIndex = 1;
    translate -= imageWidth;
    carousel.style.transform = `translate(${translate}px)`;
  }

  /**
   * ^ carousel 이미지를 이동하는 함수
   * @param {*} direction
   */
  function move(direction) {
    const imageWidth = carousel.firstElementChild.clientWidth;

    direction === "next" ? currentIndex++ : currentIndex--;
    translate = -(imageWidth * currentIndex);
    carousel.style.transform = `translate(${translate}px)`;
    carousel.style.transition = `all ${speedTime}ms ease`;
  }

  /**
   * ^ 클릭한 컨트롤러에 따라 carousel을 앞 뒤로 이동시키는 함수
   * @param {*} e
   */
  function carouselControllerHandler(e) {
    const carousel = document.querySelector(".carousel");
    const imageList = carousel.querySelectorAll("img");
    const imageWidth = carousel.firstElementChild.clientWidth;
    const carouselCount = document.querySelector(".carousel__count");
    const target = e.currentTarget;

    if (target.classList.contains("carousel__controller--next")) {
      move("next");
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
      move("prev");
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
}

function createCardElement(roomData) {
  // 방 정보들로 카드를 생성한다.

  let item = roomData.item;
  let price = ``;
  let size = ``;
  roomData.floor != null
    ? (size = `${getPyeong(item.전용면적_m2)}평 ${item.floor}층`)
    : (size = `${getPyeong(item.전용면적_m2)}평 ${item.floor_string}층`);

  let type = item.sales_type;
  switch (type) {
    case "월세":
      price = `${roomData.item.보증금액} / ${roomData.item.월세금액}`;
      break;
    case "전세":
      price = `${roomData.item.보증금액}`;
      break;
    case "매매":
      console.log("매매");
      break;
  }

  let element = "";
  cardListLayout === "card"
    ? (element = `<li class="card">
                        <div class="card__text">
                          <div class="card__price">${type} ${price}</div>
                          <div class="card__size">${size}</div>
                          <div class="card__addr">${item.local2} ${item.local3}</div>
                          <div class="card__description">
                            ${item.description}
                          </div>
                        </div>
                        <div class="card__image">
                          <img
                            src=${item.image_thumbnail}?w=400&h=300&q=70&a=1
                            alt="썸네일"
                          />
                        </div>
                      </li>`)
    : (element = `<li class="card card--short">
                        <div class="card__text card__text--short">
                          <div class="card__price card__price--short">${type} ${price}</div>
                          <div class="card__size card__size--short">${size}</div>
                        </div>
                      </li>`);

  return element;
}
/**
 * - 매물이 없을때 보여지는 Element를 반환합니다.
 * @returns element
 */
function noRoomElement() {
  let element = `<li class="card__no-result">
                      <p class="card__no-result__text"><b>장소</b>를 클릭하여</p>
                      <p class="card__no-result__text">매물을 확인해보세요.</p>
                    </li>`;
  return element;
}

/**
 * - 방 정보를 받아 cardList를 생성하고, 생성된 card들에 기능들을 적용한다.
 * - 방 정보가 null이라면 매물이 없습니다. 장소를 클릭해주세요를 보여줍니다.
 * @param {*} oneroomList [{원룸 정보}, {원룸 정보} ...]
 */
function createRoomSection(roomList) {
  // * CardList 생성
  const cardBox = document.querySelector("ul.cards");

  while (cardBox.firstChild) {
    cardBox.removeChild(cardBox.firstChild);
  }

  // roomList가 없다면 매물이 없을때의 html을 띄우고 함수 종료
  if (!roomList) {
    cardBox.insertAdjacentHTML("beforeend", noRoomElement());
    return;
  }

  roomListForChangeLayout = [...roomList];

  // 방 정보들로 카드를 생성한다.
  roomList.forEach((room) => {
    cardBox.insertAdjacentHTML("beforeend", createCardElement(room));
  });

  /**
   * 정렬을 하면 sortOneroomList로 createRoomSection(sortOneroomList)가 실행된다.
   * 따라서 originalRoomList = roomList가 실제론 originalRoomList = sortOneroomList 로 작동한다.
   * originalRoomList는 꼭 크롤링 데이터 원본이어야 한다.
   * 따라서 원본이 아닌 데이터가 originalRoomList에 저장되는 걸 막기 위해서
   * roomList가 매물 클러스터를 클릭해서 얻은 원본 데이터일때만 originalRoomList = roomList를 실행하도록 한다.
   *
   * originalRoomList는 전역에서 사용가능한 roomList이며, 정렬되지 않은 크롤링한 데이터 원본을 의미한다.
   */
  // originalRoomList와 roomlist가 일치하는게 없다면 실행한다.
  if (!originalRoomList.find((item) => item === roomList[0])) {
    originalRoomList = [...roomList];
  }

  // 카드들이 생성되었고, 이제 DOM 선택자로 선택이 가능하다.
  const cardList = document.querySelectorAll("li.card");

  // 생성된 카드들에 클릭이벤트 등록 -> 클릭시 디테일 엘리먼트를 생성하고, 이벤트를 등록한다.
  cardList.forEach((card, index) => {
    card.addEventListener("click", (e) => {
      const detailBox = document.querySelector(".detail-box");

      // 기존의 디테일 엘리먼트 삭제.
      while (detailBox.firstChild) detailBox.removeChild(detailBox.firstChild);

      // 디테일 엘리먼트 생성.
      detailBox.insertAdjacentHTML(
        "beforeend",
        createDetailElement(roomList[index])
      );

      // * 생성된 디테일 엘리먼트에 기능들을 등록합니다.
      setEventOnDetailElement();

      activeDetailBox(true);
      createStaticMap(roomList[index].item.random_location);
      setCarousel(roomList[index]);

      // 새 디테일창을 열면 스크롤을 맨 위로
      setTimeout(() => {
        detailBox.scrollTop = 0;
      }, 0);
    });
  });
}

/**
 * ^ 디테일창을 보이게 or 안보이게 하는 함수
 * @param {*} isTrue
 */
function activeDetailBox(isTrue) {
  const detailBox = document.querySelector(".detail-box");
  const cardBox = document.querySelector("ul.cards");
  if (isTrue) {
    detailBox.classList.add("open");
    cardBox.style.display = "none";
  } else {
    detailBox.classList.remove("open");
    cardBox.style.display = "block";
  }
}

/**
 * ^ 디테일창의 '위치' 항목에서 보일 정적 지도 이미지 생성 함수
 * @param {*} random_location
 */
function createStaticMap(random_location) {
  var markerPosition = new kakao.maps.LatLng(
    Number(random_location.split(",")[0]),
    Number(random_location.split(",")[1])
  );

  var marker = {
    position: markerPosition,
  };

  var staticMapContainer = document.getElementById("detail__staticMap"), // 이미지 지도를 표시할 div
    staticMapOption = {
      center: new kakao.maps.LatLng(
        Number(random_location.split(",")[0]),
        Number(random_location.split(",")[1])
      ),
      level: 3,
      marker: marker,
    };

  // 이미지 지도를 생성합니다
  let staticMap = new kakao.maps.StaticMap(staticMapContainer, staticMapOption);
}

/**
 * ^ 카드리스트 정렬 버튼을 클릭했을때 사용되는 이벤트핸들러
 * @param {*} event
 * @param {*} sort1 버튼에 해당하는 정렬값
 * @param {*} sort2 버튼에 해당하는 정렬값
 * @returns
 */
function sortBtnClick(event, sort1, sort2) {
  let btn = event.currentTarget;
  let state = btn.dataset.state;

  const up = btn.querySelector(".fa-sort-up");
  const down = btn.querySelector(".fa-sort-down");

  /**
   * 원래값을 바꾸지 않고, 정렬한 배열
   */
  let sortOneroomList = [...originalRoomList];

  if (state === "basic") state = "down";
  else if (state === "down") state = "up";
  else if (state === "up") state = "basic";

  switch (state) {
    case "basic":
      btn.dataset.state = "basic";
      up.classList.add("active");
      down.classList.add("active");
      createRoomSection(originalRoomList);

      break;

    case "down": //오름차순
      btn.dataset.state = "down";
      up.classList.remove("active");
      down.classList.add("active");

      // 보증금을 누르면 월세는 항상 basic이 되게
      // 월세를 누르면 보증금은 항상 basic이 되게, 이 코드는 흐름상 down일때만 적용하면 된다.
      if (btn === priceBtn) {
        sizeBtn.dataset.state = "basic";
        sizeBtn.querySelector(".fa-sort-up").classList.add("active");
        sizeBtn.querySelector(".fa-sort-down").classList.add("active");
      } else {
        priceBtn.dataset.state = "basic";
        priceBtn.querySelector(".fa-sort-up").classList.add("active");
        priceBtn.querySelector(".fa-sort-down").classList.add("active");
      }

      btn === priceBtn
        ? sortOneroomList.sort(
            (a, b) => Number(a.item[sort1]) - Number(b.item[sort1])
          )
        : sortOneroomList.sort(
            (a, b) => Number(a.item[sort2]) - Number(b.item[sort2])
          );

      // * 여기서 sortOneroomList가 roomList로 createRoomSection 함수를 실행시킨다. (이 파일의 중요 포인트)
      createRoomSection(sortOneroomList);

      break;

    case "up": // 내림차순
      console.log("내림차순");
      btn.dataset.state = "up";
      up.classList.add("active");
      down.classList.remove("active");
      btn === priceBtn
        ? sortOneroomList.sort(
            (a, b) => Number(b.item[sort1]) - Number(a.item[sort1])
          )
        : sortOneroomList.sort(
            (a, b) => Number(b.item[sort2]) - Number(a.item[sort2])
          );

      createRoomSection(sortOneroomList);

      break;
  }
}

function layoutBtnClick(e) {
  const btn = e.currentTarget;
  //이미 card레이아웃상태에서 또 card를 누르면 함수 종료
  if (cardListLayout === "card" && btn === layoutBtns[0]) return;
  if (cardListLayout === "short" && btn === layoutBtns[1]) return;

  if (btn === layoutBtns[0]) cardListLayout = "card";
  else cardListLayout = "short";

  layoutBtns[0].classList.remove("active");
  layoutBtns[1].classList.remove("active");
  btn.classList.add("active");

  createRoomSection(roomListForChangeLayout);
}

sortBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    sortBtnClick(e, "보증금액", "전용면적_m2");
  });
});

layoutBtns.forEach((btn) => {
  btn.addEventListener("click", layoutBtnClick);
});

export default createRoomSection;
