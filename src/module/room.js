import { loading, getPyeong } from "./etc.js";
const sortBtns = document.querySelectorAll(".sort-btn");
const layoutBtns = document.querySelectorAll(".layout-btn");
/**
 * cardList의 현재 layout상태에 대한 변수
 */
let cardListLayout = "card";
/**
 * 현재 카드리스트에 사용되는 방 정보를 저장한 배열,
 */
let currentOneroomList = null;
/**
 * sort()하기 전 원본 배열
 */
let originalOneroomList = [];

/**
 * ^ 방 정보를 받아 cardList를 생성하고, 생성된 card들에 기능들을 적용한다.
 * @param {*} oneroomList [{원룸 정보}, {원룸 정보} ...]
 */
function createCardList(roomList = null) {
  const cardBox = document.querySelector(".card-box");
  const cards = cardBox.querySelector("ul.cards");

  while (cards.firstChild) {
    cards.removeChild(cards.firstChild);
  }

  // roomList가 없다면 매물이 없을때의 html을 띄우고 함수 종료
  if (!roomList) {
    let element = `<li class="card__no-result">
                      <p class="card__no-result__text"><b>장소</b>를 클릭하여</p>
                      <p class="card__no-result__text">매물을 확인해보세요.</p>
                    </li>`;
    cards.insertAdjacentHTML("beforeend", element);
    return;
  }

  // 방 정보들로 카드를 생성한다.
  roomList.forEach((oneroom) => {
    let item = oneroom.item;
    let price = ``;
    let size = ``;
    oneroom.floor != null
      ? (size = `${getPyeong(item.전용면적_m2)}평 ${item.floor}층`)
      : (size = `${getPyeong(item.전용면적_m2)}평 ${item.floor_string}층`);

    let type = item.sales_type;
    switch (type) {
      case "월세":
        price = `${oneroom.item.보증금액} / ${oneroom.item.월세금액}`;
        break;
      case "전세":
        price = `${oneroom.item.보증금액}`;
        break;
      case "매매":
        console.log("매매");
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
    cards.insertAdjacentHTML("beforeend", element);
  });

  const cardList = document.querySelectorAll("li.card");

  // 카드를 클릭했을때 Detail 창이 열리도록 클릭이벤트 등록
  cardList.forEach((card, index) => {
    card.addEventListener("click", (e) => {
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

      const room = roomList[index].item;
      const agent = roomList[index].agent;

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
              <div class="detail__option-item-box"></div>
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
                <!-- <div class="agent__phone">${
                  agent.owner.owner_phone
                }</div> -->
                <!-- agent-box에 hover하면 배경 검어지고, 이름과 전화번호 띄우기 -->
              </div>
              <div class="detail__realtor-description">
                <pre class="detail__realtor-description-message">${
                  agent.agent_intro
                }</pre>
                <div class="view-more">더보기</div>
              </div>
            </div>`;

      // 위의 코드로 디테일창을 생성한다.
      const detailBox = document.querySelector(".detail-box");
      while (detailBox.firstChild) detailBox.removeChild(detailBox.firstChild);
      detailBox.insertAdjacentHTML("beforeend", element);

      // 새 디테일창을 열면 스크롤을 맨 위로
      setTimeout(() => {
        detailBox.scrollTop = 0;
      }, 0);

      // 옵션 정보에 대한 element 생성
      const detailOptionBox = document.querySelector(
        ".detail__option-item-box"
      );

      let optionCodeList = options.split(";").slice(0, -1);

      optionCodeList.forEach((optionCode) => {
        let element = `<div class="detail__option-item">${options_obj[optionCode]}</div>`;
        detailOptionBox.insertAdjacentHTML("beforeend", element);
      });

      // 더보기 버튼
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

      descriptionViewMore.addEventListener("click", (e) => {
        descriptionMessage.style.maxHeight = "none";
        descriptionMessage.style.whiteSpace = "pre-wrap";
        descriptionViewMore.style.display = "none";
      });

      agentViewMore.addEventListener("click", (e) => {
        agentMessage.style.maxHeight = "none";
        agentMessage.style.whiteSpace = "pre-wrap";
        agentViewMore.style.display = "none";
      });

      // 이미지 박스 요소에 carousel 기능 적용
      const imageBox = document.querySelector(".detail__image-box");
      const closeBtn = document.querySelector(".detail__header__back");
      const carousel = document.querySelector(".carousel");
      const carouselControllers = document.querySelectorAll(
        ".carousel__controller"
      );

      let currentIndex = 0;
      let translate = 0;
      const speedTime = 500;

      /**
       * ^ 디테일창을 보이게 or 안보이게 하는 함수
       * @param {*} isTrue
       */
      function activeDetailBox(isTrue) {
        if (isTrue) {
          detailBox.classList.add("open");
          cards.style.display = "none";
        } else {
          detailBox.classList.remove("open");
          cards.style.display = "block";
        }
      }

      /**
       * ^ 디테일창의 '위치' 항목에서 보일 정적 지도 이미지 생성 함수
       */
      function createStaticMap() {
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
        var staticMap = new kakao.maps.StaticMap(
          staticMapContainer,
          staticMapOption
        );
      }

      /**
       * ^ 디테일창의 이미지슬라이더 Element를 만드는 함수
       */
      function createCarousel() {
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
            // target.style.pointerEvents = "none";
            carouselCount.innerText = 1;
            setTimeout(() => {
              currentIndex = 1;
              translate = -(imageWidth * currentIndex);
              carousel.style.transition = `none`;
              carousel.style.transform = `translate(${translate}px)`;
              // target.style.pointerEvents = "auto";
            }, speedTime);
          }
        } else {
          move("prev");
          carouselCount.innerText = currentIndex;

          if (currentIndex === 0) {
            // target.style.pointerEvents = "none";
            carouselCount.innerText = imageList.length - 2;
            setTimeout(() => {
              currentIndex = imageList.length - 2;
              translate = -(imageWidth * currentIndex);
              carousel.style.transition = `none`;
              carousel.style.transform = `translate(${translate}px)`;
              // target.style.pointerEvents = "auto";
            }, speedTime);
          }
        }
      }

      activeDetailBox(true);
      createCarousel();
      createStaticMap();

      closeBtn.addEventListener("click", (e) => {
        activeDetailBox(false);
      });

      carousel.addEventListener("click", (e) => {
        if (e.target.classList.contains("carousel__image")) {
          modal.openModal();
          modal.createCarousel(images, currentIndex);
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
    });
  });

  currentOneroomList = roomList;
  if (!originalOneroomList.find((item) => item === roomList[0]))
    originalOneroomList = [...roomList];
}

/**
 * ^ 카드리스트 정렬 버튼을 클릭했을때 사용되는 이벤트핸들러
 * @param {*} event
 * @param {*} sort1 버튼에 해당하는 정렬값
 * @param {*} sort2 버튼에 해당하는 정렬값
 * @returns
 */
function sortBtnClick(event, sort1, sort2) {
  if (!currentOneroomList) {
    alert("먼저 장소를 눌러 매물정보를 확인해주세요");
    return;
  }

  let btn = event.currentTarget;
  let state = btn.dataset.state;
  const up = btn.querySelector(".fa-sort-up");
  const down = btn.querySelector(".fa-sort-down");

  /**
   * 원래값을 바꾸지 않기위해 사용하는 변수
   */
  let sortOneroomList = [...currentOneroomList];
  if (state === "basic") state = "down";
  else if (state === "down") state = "up";
  else if (state === "up") state = "basic";

  switch (state) {
    case "basic":
      btn.dataset.state = "basic";
      up.classList.add("active");
      down.classList.add("active");
      createCardList(originalOneroomList);
      break;

    case "down": //오름차순
      btn.dataset.state = "down";
      up.classList.remove("active");
      down.classList.add("active");

      // 보증금을 누르면 월세는 항상 basic이 되게
      // 월세를 누르면 보증금은 항상 basic이 되게, 이 코드는 흐름상 down일때만 적용하면 된다.
      if (btn === sortBtns[0]) {
        sortBtns[1].dataset.state = "basic";
        sortBtns[1].querySelector(".fa-sort-up").classList.add("active");
        sortBtns[1].querySelector(".fa-sort-down").classList.add("active");
      } else {
        sortBtns[0].dataset.state = "basic";
        sortBtns[0].querySelector(".fa-sort-up").classList.add("active");
        sortBtns[0].querySelector(".fa-sort-down").classList.add("active");
      }

      btn === sortBtns[0]
        ? sortOneroomList.sort(
            (a, b) => Number(a.item[sort1]) - Number(b.item[sort1])
          )
        : sortOneroomList.sort(
            (a, b) => Number(a.item[sort2]) - Number(b.item[sort2])
          );

      createCardList(sortOneroomList);
      sortOneroomList = [...originalOneroomList];
      break;

    case "up": // 내림차순
      btn.dataset.state = "up";
      up.classList.add("active");
      down.classList.remove("active");
      btn === sortBtns[0]
        ? sortOneroomList.sort(
            (a, b) => Number(b.item[sort1]) - Number(a.item[sort1])
          )
        : sortOneroomList.sort(
            (a, b) => Number(b.item[sort2]) - Number(a.item[sort2])
          );

      createCardList(sortOneroomList);
      sortOneroomList = [...originalOneroomList];
      break;
  }
}

sortBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    sortBtnClick(e, "보증금액", "월세금액");
    // 아파트 : 매매, 보증금액(전세)
    // 빌라 : 매매, 보증금액(전세)
    // 원룸 : 보증금액, 월세
    // 오피스텔 : 보증금액, 월세
  });
});

layoutBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    if (!currentOneroomList) {
      alert("먼저 장소를 눌러 매물정보를 확인해주세요");
      return;
    }

    //이미 card레이아웃상태에서 또 card를 누르면 함수 종료
    if (cardListLayout === "card" && btn === layoutBtns[0]) return;
    if (cardListLayout === "short" && btn === layoutBtns[1]) return;

    if (btn === layoutBtns[0]) cardListLayout = "card";
    else cardListLayout = "short";

    layoutBtns[0].classList.remove("active");
    layoutBtns[1].classList.remove("active");
    btn.classList.add("active");

    createCardList(currentOneroomList);
  });
});

export default createCardList;
