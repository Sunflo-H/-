import Oneroom from "./oneroomModule.js";
import KakaoSearch from "./kakaoSearchModule.js";

const filterCategories = document.querySelectorAll(".filter__category");
const filterCategory_price = filterCategories[0];
const filterCategory_size = filterCategories[1];
const hyperLocal = filterCategories[2];

const sortBtns = document.querySelectorAll(".sort-btn");
const layoutBtns = document.querySelectorAll(".layout-btn");

const search = document.querySelector(".search");
const searchInput = search.querySelector(".search__input");
const searchList = search.querySelector(".search-list");
const nav = document.querySelector(".nav");
const navbox = document.querySelector(".nav__item-box");
const navItems = nav.querySelectorAll(".nav__item");

const CRITERIA_MAP_LEVEL = 7;
const oneroom = new Oneroom();
const kakaoSearch = new KakaoSearch();
/**
 * * id :
 * * name : 오버레이에 보여질 이름
 * * lat, lng : 좌표
 */
const local = [
  { id: "강원도", name: "강원도", lat: "37.555837", lng: "128.209315" },
  { id: "충청남도", name: "충청남도", lat: "36.557229", lng: "126.779757" },
  { id: "광주광역시", name: "광주", lat: "35.126033", lng: "126.831302" },
  { id: "대구광역시", name: "대구", lat: "35.798838", lng: "128.583052" },
  { id: "대전광역시", name: "대전", lat: "36.321655", lng: "127.378953" },
  { id: "경상북도", name: "경상북도", lat: "36.248647", lng: "128.664734" },
  { id: "경상남도", name: "경상남도", lat: "35.259787", lng: "128.664734 " },
  { id: "부산광역시", name: "부산", lat: "35.198362", lng: "129.053922" },
  { id: "울산광역시", name: "울산", lat: "35.519301", lng: "129.239078" },
  // { id: "경기도", name: "경기도", lat: "37.567167", lng: "127.190292" },
  // { id: "인청광역시", name: "인천", lat: "37.469221", lng: "126.573234" },
  // { id: "서울특별시", name: "서울", lat: "37.5642135", lng: "127.0016985" },
  { id: "수도권", name: "수도권", lat: "37.5642135", lng: "127.0016985" },
];
/**
 * 지역 오버레이 배열
 * * 지역 오버레이를 '보여질때', '안보여질때'를 적용하기위해 사용한다.
 */
const localOverlayList = [];
/**
 * 지하철 오버레이 배열
 * * 지하철 오버레이를 '보여질때', '안보여질때'를 적용하기위해 사용한다.
 */
const subwayOverlayList = [];
/**
 * 생성된 클러스터 객체 : _clusters, _markers 등의 여러 정보를 가지고있다.
 */
let roomCluster = null;
/**
 * roomCluster 존재여부를 확인하는 변수,
 * roomCluster는 promise데이터로 만들기때문에 지연되는 시간차를 막고자 따로 만들었다.
 */
let roomClusterState = false;
/**
 * 클러스터를 생성할때 마커와 방정보를 함께 매핑한 배열
 */
let roomAndMarker = null;
/**
 * 현재 카드리스트에 사용되는 방 정보를 저장한 배열,
 */
let currentOneroomList = null;

/**
 * sort()하기 전 원본 배열
 */
let originalOneroomList = [];
/**
 * cardList의 현재 layout상태에 대한 변수
 */
let cardListLayout = "card";

/**
 * 검색 결과 정보와 마커를 담은 배열
 */
const markerList = [];
/**
 * 마커를 클릭시 열리는 창
 */
let infoWindow = null;

/**
 * filter 하기 전 원본 배열
 */
let originalRoomAndMarker = [];

/**
 * 세권의 범위를 표현하는데 사용하는 원의 배열
 */
const circleList = [];

/**
 * 세권 마커정보 배열
 */
const hyperLocalMarkerList = [];

/**
 * !설명
 * 지역, 지하철은 customOverlay로 만들었다. 방은 cluster로 만들었다.
 *
 * !지도 이용 순서
 * 1. init()함수로 지역, 지하철 오버레이를 생성한다.
 * 2. 지하철 오버레이를 클릭하면 방 클러스터가 생성된다.
 * 3. 방을 리스트로 보여주며, 모든 방에 대해 필터적용, 각 방에 대한 세권찾기
 *
 *
 * 역세권 거리
 * 반경 250m, 500m, 1km
 */

//! 할것
//* 검색기능
//  1. 입력된 값으로 검색하기 +
//  2. 검색한 내용을 마커로 표시하기 +
//   2-1 마커를 꾸밀수 있나? 꾸밀수 있으면 마커로 +
//   2-2 꾸밀수 없다면 꾸밀수 있는 무언가로 + 오버레이로 합시다.
//   2-3 어떻게 꾸미는게 좋을까 +
//   2-4 마커 클릭하면 정보 띄우자 인포윈도우 +
//   2-5 인포윈도우 꾸미기 +
//  3. 자동완성 +
//  4. 자동완성 클릭, 엔터 이벤트 +
//  6. 검색중 위 아래키 입력 +

//* 필터 만들기 +
//  1. 필터 클릭시 활성화 +
//  2. 필터 안에 버튼 두개 (금액옵션, 구조·면적옵션) +
//  3. 필터 옵션창을 클릭했을때 필터가 비활성화됨 => 이벤트 위임을 막음 +
//  4. 각 nav별로 기능 만들어두고 원룸 위주로 완성
//  5. 필터가 적용되게끔 하기
//  5-1 거래유형 버튼 : 버튼에 따라 보증금과 월세를 보여줌 +
//  5-2 금액 최소~최대 기능 : 최소(대)만 입력되었을때, 최대가 최소보다 작을때 +
//  5-3 적용 버튼 클릭 : 모든 필터 옵션들이 적용 +
//  5-4 초기화 버튼 클릭: 모든 필터 옵션 초기화 +
//  6 구조 면적 필터도 만들기 +

//* 세권 만들기
//매물 클러스터 클릭하고 세권 필터를 눌러서 적용한경우 세권 생성!
//  1. 세권 클릭이벤트 등록
//  2. 적용시 마커 생성

//* 처음에 자기 위치 받아와서 바로 지하철로 보이게 만들기
//* 카드 클릭시 디테일 정보 보여주기
//* 각 페이지 별 기능 만들기
//* 로그인 기능
//* 카드 정렬 버튼 클릭했을때 스크롤이 제일 위로 가게

// 지도 생성
const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392),
  level: 8,
  maxLevel: 12,
});

//* ============================== 방 정보, 방 클러스터 관련 코드들 =================================
/**
 *
 * ^ 역 주변 방정보를 요청하여 클러스터를 생성한다..
 */
async function createOneRoomCluster(subway) {
  loading(true);

  let oneroomList = await oneroom.getRoomData(subway); // 프로미스 배열이 있음, await 안쓰면 프로미스 안에 프로미스배열이 있음

  Promise.all(oneroomList).then((oneroomList) => {
    createCluster(oneroomList);
    loading(false);
  });
}

/**
 * ^ 방 정보를 받아 cardList를 생성한다.
 * @param {*} oneroomList [{원룸 정보}, {원룸 정보} ...]
 * * 생성
 * 1. 클러스터 클릭시 카드 생성
 * 2. 지하철, 지역상태에서 확대했는데 방 정보가 있을때
 *
 * * 삭제
 * 1. 지도 축소 해서 지하철, 지역이 보일때
 */
function createCardList(roomList = null) {
  const cardBox = document.querySelector(".card-box");
  const cards = cardBox.querySelector("ul.cards");

  while (cards.firstChild) {
    cards.removeChild(cards.firstChild);
  }

  // roomList가 없다면 기본값을 띄우고 함수 종료
  if (!roomList) {
    let element = `<li class="no-result">
                    <p class="no-result__text"><b>장소</b>를 클릭하여</p>
                    <p class="no-result__text">매물을 확인해보세요.</p>
                  </li>`;
    cards.insertAdjacentHTML("beforeend", element);
    return;
  }

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

  currentOneroomList = roomList;
  // 오리지널에 일치하는 값이 있다면 이미 오리지널이 존재하므로 바꾸지 않는다.
  // 오리지널에 일치하는 값이 없다면 아직 오리지널에 값을 저장하지 않은것이므로 roomList를 저장한다.
  if (!originalOneroomList.find((item) => item === roomList[0]))
    originalOneroomList = [...roomList];
}

/**
 * ^ 좌표 리스트를 받아 클러스터를 생성하는 함수
 *
 * @param {*} coords
 */
function createCluster(roomList) {
  roomCluster = new kakao.maps.MarkerClusterer({
    map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
    averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
    minLevel: 1, // 클러스터 할 최소 지도 레벨
    gridSize: 60,
    minClusterSize: 1, // Number : 클러스터링 할 최소 마커 수 (default: 2)
    disableClickZoom: true,
    styles: [
      {
        width: "40px",
        height: "40px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "40px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
      {
        width: "53px",
        height: "52px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "54px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
    ],
    calculator: [10],
  });

  roomAndMarker = [];

  let markers = roomList.map(function (room, i) {
    let position = room.item.random_location.split(",");
    let marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position[0], position[1]),
    });

    // 방 정보와 마커를 매핑
    roomAndMarker.push({ roomData: room, marker: marker });
    return marker;
  });

  // 새 지하철역을 클릭했을때 originalRoomAndMarker는 초기화된다.
  // 초기화된 original에 새 값을 저장
  if (originalRoomAndMarker.length === 0)
    originalRoomAndMarker = [...roomAndMarker];

  roomCluster.setTexts((size) => {
    let text = "";

    if (size > 100) text = "100+";
    else text = size;

    return text;
  });

  roomCluster.addMarkers(markers); // 클러스터 생성

  // 처음 생성된 클러스터의 엘리먼트들에 적용하는 css변화 이벤트 (clustered 이벤트핸들러와 기능은 같다.)
  roomCluster._clusters.forEach((cluster) => {
    let overlay = cluster.getClusterMarker().getContent();

    // const clickHandler = (e) => {
    //   console.log("처음생성 된");
    //   roomCluster._clusters.forEach((cluster) => {
    //     if (e.currentTarget === cluster.getClusterMarker().getContent()) return;
    //     cluster
    //       .getClusterMarker()
    //       .getContent()
    //       .classList.remove("cluster-click");
    //   });
    //   e.currentTarget.classList.toggle("cluster-click");

    //   // 이때 해당 클러스터가 활성화상태면 카드를 생성하고, 아니라면 삭제한다.
    //   if (e.currentTarget.classList.contains("cluster-click")) {
    //     let roomList = cluster
    //       .getMarkers()
    //       .map(
    //         (marker) =>
    //           roomAndMarker.find((item) => marker === item.marker).roomData
    //       );
    //     createCardList(roomList);
    //   } else createCardList();

    //   // 카드리스트가 생성, 삭제될때마다 정렬버튼을 초기화한다.
    //   sortBtns.forEach((btn) => {
    //     const up = btn.querySelector(".fa-sort-up");
    //     const down = btn.querySelector(".fa-sort-down");
    //     btn.dataset.state = "basic";
    //     up.classList.add("active");
    //     down.classList.add("active");
    //   });
    // };

    overlay.addEventListener("mouseover", function (e) {
      if (!this.classList.contains("cluster-over")) {
        this.classList.add("cluster-over");
      }
    });

    overlay.addEventListener("mouseout", function (e) {
      if (this.classList.contains("cluster-over")) {
        this.classList.remove("cluster-over");
      }
    });
  });

  // 처음 생성된 이후 zoomIn, out, 지도이동으로 생기는 클러스터의 엘리먼트들에게 적용
  kakao.maps.event.addListener(roomCluster, "clustered", function (clusters) {
    for (let i = 0; i < clusters.length; i++) {
      let cluster = clusters[i];
      let overlay = cluster.getClusterMarker().getContent();

      overlay.addEventListener("mouseover", function () {
        if (!this.classList.contains("cluster-over")) {
          this.classList.add("cluster-over");
        }
      });

      overlay.addEventListener("mouseout", function () {
        if (this.classList.contains("cluster-over")) {
          this.classList.remove("cluster-over");
        }
      });
    }
  });

  kakao.maps.event.addListener(roomCluster, "clusterclick", function (cluster) {
    let overlay = cluster.getClusterMarker().getContent();
    overlay.classList.toggle("cluster-click");
    roomCluster._clusters.forEach((innerCluster) => {
      if (innerCluster === cluster) return;
      innerCluster
        .getClusterMarker()
        .getContent()
        .classList.remove("cluster-click");
    });

    if (overlay.classList.contains("cluster-click")) {
      let roomList = cluster
        .getMarkers()
        .map(
          (marker) =>
            roomAndMarker.find((item) => marker === item.marker).roomData
        );
      createCardList(roomList);
    } else createCardList(null);

    sortBtns.forEach((btn) => {
      const up = btn.querySelector(".fa-sort-up");
      const down = btn.querySelector(".fa-sort-down");
      btn.dataset.state = "basic";
      up.classList.add("active");
      down.classList.add("active");
    });
  });
}

function removeCluster() {
  if (roomCluster) roomCluster.clear();
}

/**
 * ^ 클러스터의 CSS(setStyle())에 변화를 줘서 클러스터를 보이게, 안보이게 하는 함수
 * @param {*} boolean
 */
function displayRoomCluster(boolean) {
  let style = [];
  if (boolean) {
    style = [
      {
        width: "40px",
        height: "40px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "40px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
      {
        width: "53px",
        height: "52px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "54px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
    ];
  } else {
    style = [
      {
        display: "none",
      },
    ];
  }
  // kakao 에서 제공하는 cluster style 변경 함수
  if (roomCluster) roomCluster.setStyles(style);
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

//* =============================== 지역 / 지하철 오버레이 관련 코드들 ===============================
/**
 *^ 서울, 경기, 부산 등 지역정보를 보여주는 오버레이를 생성하고, 배열에 저장하는 함수
 *^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 * @param {*} local [{id:대구광역시,name:대구,lat,lng},{}...]
 */
function createOverlay_local(local) {
  local.forEach((data) => {
    let content =
      data.id === "수도권"
        ? `<div class="customOverlay customOverlay--local customOverlay--capital" data-id="${data.id}" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`
        : `<div class="customOverlay customOverlay--local" data-id="${data.id}" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`;
    let customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      content: content,
      clickable: true,
      position: new kakao.maps.LatLng(data.lat, data.lng),
      xAnchor: 0.5,
      yAnchor: 1,
    });
    localOverlayList.push(customOverlay);
  });

  const overlayList = document.querySelectorAll(".customOverlay");

  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClick);
  });
}

/**
 * ^ 모든 지하철역에 대한 overlay객체를 생성하고, 배열에 저장하는 함수.
 * ^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 */
async function createOverlay_subway() {
  let subwayList = await oneroom.getSubwayInfo_all();
  subwayList.forEach((data) => {
    let content = `<div class="customOverlay customOverlay--subway" data-id="${data.id}" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`;

    let customOverlay = new kakao.maps.CustomOverlay({
      content: content,
      clickable: true,
      position: new kakao.maps.LatLng(data.lat, data.lng),
      xAnchor: 0.5,
      yAnchor: 1,
    });
    subwayOverlayList.push(customOverlay);
  });
}

/**
 * ^ 클릭한 지역오버레이를 중심으로 지도를 확대하는 이벤트 핸들러
 * @param {*} event 클릭한 오버레이 정보
 */
function localOverlayClick(event) {
  let overlay = event.target;
  map.setLevel(CRITERIA_MAP_LEVEL - 1);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

/**
 * ^ 클릭한 지하철오버레이를 중심으로 지도를 확대하는 이벤트 핸들러
 *
 * @param {*} event
 */
function subwayOverlayClick(event) {
  let overlay = event.target;

  // 방 클러스터가 있음을 알리는 상태
  roomClusterState = true;

  // 이미 방에 대한 마커가 있다면 삭제, 삭제하지 않으면 계속 중첩된다.
  removeCluster();

  // 방 정보를 요청하여 방클러스터 생성
  createOneRoomCluster(overlay.dataset.name);

  // 새로운 지하철로 매물을 검색했으니 필터용 오리지널 방 정보를 초기화
  originalRoomAndMarker.length = 0;

  map.setLevel(5);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

/**
 * ^ 지역, 지하철 overlay들에게 클릭이벤트를 등록하는 함수
 */
function overlaySetEvent() {
  const localOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--local"
  );
  localOverlay.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClick);
  });

  // 지하철 오버레이는 많아서 모든 오버레이를 선택할수 있게 살짝 지연시켰다.
  setTimeout(() => {
    const subwayOverlay = document.querySelectorAll(
      ".customOverlay.customOverlay--subway"
    );

    subwayOverlay.forEach((overlay) => {
      overlay.addEventListener("click", subwayOverlayClick);
    });
  }, 500);
}

/**
 * ^ 로딩바가 보이게 하는 함수
 * @param {*} boolean ture:보인다, false:사라진다.
 */
function loading(boolean) {
  const loading = document.querySelector("#loading");
  if (boolean) loading.classList.add("active");
  else loading.classList.remove("active");
}

/**
 * ^ 평수를 구하는 함수
 * @param {*} size 전용면적
 * @returns 평수
 */
function getPyeong(size) {
  return Math.floor(Math.round(Number(size)) / 3);
}

/**
 * ^ 지역 오버레이와 지하철 오버레이를 보이게 할지 안보이게 할지 정하는 함수
 * * map : 지도에 보이게한다.
 * * null : 안보이게 한다.
 * @param {*} localState map, null
 * @param {*} subwayState map, null
 */
function displayOverlay_local_subway(localState, subwayState) {
  localOverlayList.forEach((localOverlay) => localOverlay.setMap(localState));
  subwayOverlayList.forEach((subwayOverlay) =>
    subwayOverlay.setMap(subwayState)
  );
}

//* ============================================== 검색 기능 관련 코드들 ========================================================

/**
 * ^ up key에 대한 이벤트 핸들러, 자동완성 리스트에서 위쪽으로 한칸씩 이동한다.
 */
function upKey() {
  const searchListItem = document.querySelectorAll(".search-list__item");

  let current; // active인 item

  // active가 존재하는지 체크 후 존재한다면 current = active인 item
  searchListItem.forEach((item) => {
    if (item.classList.contains("active")) current = item;
  });

  // current가 없으면 마지막 item이 current
  if (!current) {
    current = searchListItem[searchListItem.length - 1];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  current.classList.remove("active");

  // current가 있고, 이전 item이 없다면 마지막 item이 current가 된다.
  if (!current.previousElementSibling) {
    current = searchListItem[searchListItem.length - 1];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  // current가 있고, 이전 item이 있다면 이전 item이 current가 된다.
  current = current.previousElementSibling;
  current.classList.add("active");
  searchInput.value = current.innerText;
}

/**
 * ^ down key에 대한 이벤트 핸들러, 자동완성 리스트에서 아래쪽으로 한칸씩 이동한다.
 */
function downKey() {
  const searchListItem = document.querySelectorAll(".search-list__item");

  let current;
  searchListItem.forEach((item) => {
    if (item.classList.contains("active")) current = item;
  });

  if (!current) {
    current = searchListItem[0];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  current.classList.remove("active");

  if (!current.nextElementSibling) {
    current = searchListItem[0];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  current = current.nextElementSibling;
  current.classList.add("active");
  searchInput.value = current.innerText;
}

/**
 * ^ enter key에 대한 이벤트 핸들러, 입력된 값으로 검색을 한다.
 */
function enterKey() {
  const lat = map.getCenter().Ma;
  const lng = map.getCenter().La;

  if (!searchInput.value) return;

  kakaoSearch.search(searchInput.value, lat, lng).then((data) => {
    const addressSearchData = data[0];
    const keywordSearchData = data[1];
    console.log(data);

    // 주소검색 결과가 있다면 주소검색 결과만 다룬다.
    if (addressSearchData.length !== 0) {
      removeMarker();
      removeInfoWindow();
      addressSearchData.forEach((data) => {
        createMarker(data);
      });
    }
    // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
    else if (addressSearchData.length === 0 && keywordSearchData.length !== 0) {
      removeMarker();
      removeInfoWindow();
      keywordSearchData.forEach((data) => {
        createMarker(data);
      });
    }
    // 주소데이터, 키워드데이터 둘다 없다면
    else if (addressSearchData.length === 0 && keywordSearchData.length === 0) {
      alert("검색 결과가 없습니다.");
    }
  });
  displaySearchList(false);
}

/**
 * ^ 자동완성 결과 창을 활성화, 비활성화 한다.
 * @param {*} isTrue
 */
function displaySearchList(isTrue) {
  if (isTrue) {
    searchList.classList.add("active");
  } else {
    searchList.classList.remove("active");
  }
}

/**
 * ^ 검색리스트의 자동완성단어를 세팅하는 함수
 * @param {*} addressData [주소명,주소명...]
 * @param {*} keywordData [장소명,장소명...]
 * @returns
 */
function setAutoComplete(addressData, keywordData) {
  let element = "";

  //자동완성 데이터가 없다면 검색리스트 창을 닫는다.
  if (addressData.length === 0 && keywordData.length === 0) {
    displaySearchList(false);
    return;
  }

  while (searchList.firstChild) {
    searchList.removeChild(searchList.firstChild);
  }

  addressData.forEach((data, index) => {
    if (index >= 5) return;
    element = `<div class="search-list__item">${data}</div>`;
    searchList.insertAdjacentHTML("beforeend", element);
  });

  keywordData.forEach((data, index) => {
    element = `<div class="search-list__item">${data}</div>`;
    searchList.insertAdjacentHTML("beforeend", element);
  });

  // 만들어진 자동완성 단어들에게 이벤트 등록
  const searchListItem = document.querySelectorAll(".search-list__item");
  searchListItem.forEach((item) => {
    // 클릭시 검색
    item.addEventListener("click", (e) => {
      let text = e.currentTarget.innerText;

      const lat = map.getCenter().Ma;
      const lng = map.getCenter().La;

      kakaoSearch.search(text, lat, lng).then((data) => {
        const addressSearchData = data[0];
        const keywordSearchData = data[1];

        // 주소검색 결과가 있다면 주소검색 결과만 다룬다.
        if (addressSearchData.length !== 0) {
          removeMarker();
          removeInfoWindow();
          addressSearchData.forEach((data) => {
            createMarker(data);
          });
        }
        // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
        else if (
          addressSearchData.length === 0 &&
          keywordSearchData.length !== 0
        ) {
          removeMarker();
          removeInfoWindow();
          keywordSearchData.forEach((data) => {
            createMarker(data);
          });
        }
        // 주소데이터, 키워드데이터 둘다 없다면
        else if (
          addressSearchData.length === 0 &&
          keywordSearchData.length === 0
        ) {
          alert("검색 결과가 없습니다.");
        }
      });
      displaySearchList(false);
    });
  });
}

/**
 * ^ 장소 data를 받아 마커를 생성하고 이벤트를 적용하는 함수
 * @param {*} data
 */
function createMarker(data) {
  let address = data.address_name || null;
  // let roadAddress = data.road_address_name || null;
  let place = data.place_name || null;
  let category = data.category_group_name; //주소, 장소, 음식점-카페 등등
  let lat = data.y;
  let lng = data.x;

  let content = "";
  place === null
    ? (content = `<div class="infoWindow__content">
                    <div class="infoWindow__address infoWindow__address-data">${address}</div>
                  </div>`)
    : (content = `<div class="infoWindow__content">
                    <div class="infoWindow__place">${place}</div>
                    <div class="infoWindow__category">${category}</div>
                    <div class="infoWindow__address">${address}</div>
                  </div>`);

  let marker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(lat, lng),
  });

  // let markerImage = new kakao.maps.MarkerImage(
  //   "../../img/map/marker1.png",
  //   new kakao.maps.Size(30, 30),
  //   new kakao.maps.Point(15, 26)
  // );
  let markerImage = new kakao.maps.MarkerImage(
    "../../img/map/marker_bar.png",
    new kakao.maps.Size(25, 25),
    new kakao.maps.Point(15, 26)
  );
  // let markerImage = new kakao.maps.MarkerImage(
  //   "../../img/map/marker_drink.png",
  //   new kakao.maps.Size(25, 25),
  //   new kakao.maps.Point(15, 26)
  // );
  marker.setImage(markerImage);

  kakao.maps.event.addListener(marker, "click", function () {
    if (infoWindow) infoWindow.close();
    infoWindow = new kakao.maps.InfoWindow({
      position: new kakao.maps.LatLng(lat, lng),
      content: content,
    });
    let infoWindowBox = infoWindow.a;
    let infoWindowArrow = infoWindow.a.firstElementChild;
    let infoWindowContentBox = infoWindow.Uf;
    infoWindowBox.classList.add("infoWindow-box");
    infoWindowArrow.classList.add("infoWindow__arrow");
    infoWindowContentBox.classList.add("infoWindow__content-box");
    infoWindow.open(map, marker);
  });

  let marekrObj = {
    marker: marker,
    info: data,
  };

  markerList.push(marekrObj);
}

/**
 * ^ 마커를 모두 삭제한다.
 */
function removeMarker() {
  markerList.forEach((obj) => {
    obj.marker.setMap(null);
  });
  markerList.length = 0;
}

/**
 * ^ 인포윈도우를 닫는다.
 */
function removeInfoWindow() {
  if (infoWindow) infoWindow.close();
}

// 검색창을 클릭하면 검색창(search)에 active를 주고, searchInput에 focus를 준다.
search.addEventListener("click", (e) => {
  search.classList.add("active");
  searchInput.focus();
});

// search 관련 element 외의 것들을 클릭시 search의 active가 사라지는 이벤트
document.addEventListener("click", (e) => {
  if (
    e.target !== search &&
    e.target !== searchInput &&
    e.target !== searchList
  ) {
    search.classList.remove("active");
    searchList.classList.remove("active");
  }
});

/**
 * 검색창에 위, 아래, 엔터 각각의 함수를 이벤트로 등록한다.
 * 검색창에 값이 입력되면 검색창 아래에 리스트를 만들고 자동완성단어를 세팅한다.
 */
searchInput.addEventListener("keyup", (e) => {
  // 엔터, 방향키 입력시
  if (e.keyCode === 13) {
    enterKey();
    return;
  } else if (e.keyCode === 38) {
    if (searchList.classList.contains("active")) upKey();
    return;
  } else if (e.keyCode === 40) {
    if (searchList.classList.contains("active")) downKey();
    return;
  } else if (e.isComposing === false) return; //엔터키 중복입력을 막는다.

  // 그 외 입력시

  displaySearchList(true);

  kakaoSearch.search_autoComplete(searchInput.value).then((data) => {
    // 주소명, 장소명만 뽑아 자동완성을 세팅한다.

    const addressSearchData = data[0].map((item) => item.address_name);
    const keywordSearchData = data[1];
    setAutoComplete(addressSearchData, keywordSearchData);
  });
});

searchInput.addEventListener("input", (e) => {
  if (searchInput.value === "") {
    // 검색어를 지우다가 value === "" 이 됐을때, 이코드는 input에 적용해야 제대로 작동한다.
    displaySearchList(false);
    return;
  }
});

searchInput.addEventListener("keydown", (e) => {
  // 위,아래 입력시 커서가 이동하는걸 막음
  if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();
});

//* ========================================== 필터 관련 코드들 ================================================

function filterApply_oneroom() {
  // * 유형 . 금액 변수들
  // 보증금
  const divDepositValue = filterCategory_price.querySelector(
    ".filter__option--deposit .filter__option-value"
  );
  const depositMin =
    filterCategory_price.querySelector(".filter__input-deposit--min") || null;
  const depositMax =
    filterCategory_price.querySelector(".filter__input-deposit--max") || null;

  // 월세
  const divRentValue = filterCategory_price.querySelector(
    ".filter__option--rent .filter__option-value"
  );
  const rentMin =
    filterCategory_price.querySelector(".filter__input-rent--min") || null;
  const rentMax =
    filterCategory_price.querySelector(".filter__input-rent--max") || null;

  // 관리비 포함여부
  const manageCost = filterCategory_price.querySelector(
    ".filter__option--manage-cost .toggle"
  );

  // * 구조 . 면적 변수들
  const structureValue = filterCategory_size.querySelector(
    ".filter__option--structure .filter__option-value"
  );
  const floorValue = filterCategory_size.querySelector(
    ".filter__option--floor .filter__option-value"
  );
  const sizeValue = filterCategory_size.querySelector(
    ".filter__option--size .filter__option-value"
  );
  // 주차가능 여부
  const parkable = filterCategory_size.querySelector(
    ".filter__option--parkable .toggle"
  );

  // * 필터적용 코드
  let salesType = salesTypeValue.dataset.value;

  let roomData = originalRoomAndMarker.map((item) => item.roomData);

  // 전체, 전세, 월세 필터
  let result = roomData.filter((room) => {
    // 전체이면 모든 아이템을 리턴
    if (salesType === "전체") {
      return room;
    }
    // 전세, 월세인경우 일치하는 아이템을 리턴
    else if (room.item.sales_type === salesType) return room;
  });

  // 보증금 최소금액, 최대금액 필터
  if (depositMin.value || depositMax.value) {
    result = result.filter((room) => {
      // 최소값만 있을때
      if (depositMin.value && !depositMax.value) {
        if (depositMin.value <= room.item.보증금액) return room;
      }
      // 최대값만 있을때
      else if (depositMax.value && !depositMin.value) {
        if (depositMax.value >= room.item.보증금액) return room;
      }
      // 모두 있을때
      else {
        if (
          depositMin.value <= room.item.보증금액 &&
          room.item.보증금액 <= depositMax.value
        )
          return room;
      }
    });
  }

  // 월세 최소금액, 최대금액 필터 + 관리비 포함여부
  if (salesType !== "전세") {
    if (rentMin.value || rentMax.value) {
      result = result.filter((room) => {
        // 최소값만 있을때
        if (rentMin.value && !rentMax.value) {
          if (!manageCost.checked && rentMin.value <= room.item.월세금액)
            return room;
          else if (
            manageCost.checked &&
            rentMin.value <=
              Number(room.item.월세금액) + Number(room.item.manage_cost)
          )
            return room;
        }
        // 최대값만 있을때
        else if (rentMax.value && !rentMin.value) {
          if (!manageCost.checked && rentMax.value >= room.item.월세금액)
            return room;
          else if (
            manageCost.checked &&
            rentMax.value >=
              Number(room.item.월세금액) + Number(room.item.manageCost)
          )
            return room;
        }
        // 모두 있을때
        else {
          if (
            !manageCost.checked &&
            rentMin.value <= room.item.월세금액 &&
            room.item.월세금액 <= rentMax.value
          )
            return room;
          else if (
            manageCost.checked &&
            rentMin.value <=
              Number(room.item.월세금액) + Number(room.item.manage_cost) &&
            Number(room.item.월세금액) + Number(room.item.manage_cost) <=
              rentMax.value
          )
            return room;
        }
      });
    }
  }

  //* 구조 옵션 적용
  let arr = structureValue.innerText.split(", ");
  let room_structure_obj = {
    분리형: "01",
    오픈형: "02",
    복층형: "03",
    투룸: "04",
    "쓰리룸+": "05",
    "포룸+": "06",
  };
  result = result.filter((room) => {
    if (structureValue.innerText === "전체") return room;

    // structureValue의 배열의 값이 1개인경우
    if (arr.length === 1) {
      if (room.item.room_type === room_structure_obj[arr[0]]) return room;
    }
    // structureValue의 배열의 값이 2개인경우
    else if (arr.length === 2) {
      if (
        room.item.room_type === room_structure_obj[arr[0]] ||
        room.item.room_type === room_structure_obj[arr[1]]
      )
        return room;
    }
  });

  //* 층 옵션 적용
  result = result.filter((room) => {
    // console.log(room.item.floor, room.item.floor_string);
    if (floorValue.innerText === "전체") {
      return room;
    } else if (floorValue.innerText === "지상") {
      if (
        room.item.floor_string !== "옥탑방" &&
        room.item.floor_string !== "반지하"
      )
        return room;
    } else if (floorValue.innerText === "반지하") {
      if (room.item.floor_string === "반지하") return room;
    } else if (floorValue.innerText === "옥탑") {
      if (room.item.floor_string === "옥탑방") return room;
    }
  });

  //* 면적 옵션 적용
  result = result.filter((room) => {
    let str = sizeValue.innerText;
    let pyeong = getPyeong(room.item.전용면적_m2);

    // n평 이하인경우
    if (str.includes("이하")) {
      if (pyeong <= str.slice(0, 2)) return room;
    }
    // n평 이상인경우
    else if (str.includes("이상")) {
      // console.log("이상");
      if (pyeong >= str.slice(0, 2)) return room;
    }
    // n평 ~ m평 인경우
    else if (str.includes("~")) {
      // console.log("~");
      if (str.slice(0, 2) <= pyeong && pyeong <= str.slice(7, 9)) return room;
    }
    // 전체인경우
    else if (str === "전체") return room;
    // n평대 하나인경우
    else {
      if (str.slice(0, 2) <= pyeong && pyeong <= Number(str.slice(0, 2)) + 9)
        return room;
    }
  });

  result = result.filter((room) => {
    /**
     * 체크 아닐때
     * 체크 되었을때
     */
    if (parkable.checked) {
      if (room.item.parking !== "불가능") return room;
    } else return room;
  });

  removeCluster();
  createCluster(result);
  createCardList();
}

// 모든 filter__category 클릭시 필터옵션창을 여는 이벤트
filterCategories.forEach((filterCategory, index) => {
  const filterContent = filterCategory.querySelector(".filter__content");
  const title = filterCategory.querySelector(".filter__category-title");
  const arrow = filterCategory.querySelector(".filter__category-arrow");

  filterCategory.addEventListener("click", (e) => {
    //이벤트 위임을 막음
    if (e.target !== filterCategory && e.target !== title && e.target !== arrow)
      return;

    // 한번에 하나의 필터 카테고리만 활성화하기 위한 코드
    filterCategories.forEach((filterCategory_inner) => {
      const filterContent =
        filterCategory_inner.querySelector(".filter__content");
      if (filterCategory_inner.classList.contains("active")) {
        // 열려있는게 자신이라면 닫지않는다. (forEach 이후의 코드에서 toggle로 닫을거임)
        if (filterCategory === filterCategory_inner) return;
        filterCategory_inner.classList.remove("active");
        filterContent.classList.remove("active");
      }
    });
    // 필터 카테고리 토글
    filterCategory.classList.toggle("active");

    // 활성화 여부에 따라 필터 컨텐츠창 열기, 닫기
    if (filterCategory.classList.contains("active"))
      filterContent.classList.add("active");
    else filterContent.classList.remove("active");
  });
});

//* 필터 : 유형·금액
const optionBtns_salesType = filterCategory_price.querySelectorAll(
  ".filter__option--price .filter__option-btn"
);
const salesTypeValue = filterCategory_price.querySelector(
  ".filter__option--price .filter__option-value"
);
optionBtns_salesType.forEach((optionBtn) => {
  optionBtn.addEventListener("click", (e) => {
    // 옵션버튼들을 순회하면서 모든 active를 지움
    optionBtns_salesType.forEach((optionBtn_inner) =>
      optionBtn_inner.classList.remove("active")
    );

    // 클릭한 옵션버튼에 active 추가
    e.currentTarget.classList.add("active");

    salesTypeValue.dataset.value = e.currentTarget.dataset.option;
    salesTypeValue.innerText = salesTypeValue.dataset.value;
    createFilterOptionContent_price(salesTypeValue.dataset.value);
  });
});

/**
 * 필터 중 거래유형(전체,월세, 전세)에 대한 보증금, 월세, 관리비 option-content element를 생성하고 이벤트를 등록하는 함수
 * @param {*} option "전체" or "월세" or "전세"
 */
function createFilterOptionContent_price(option) {
  const filterOptionContent = document.querySelector(".filter__option-content");
  let element = "";

  while (filterOptionContent.firstChild) {
    filterOptionContent.removeChild(filterOptionContent.firstChild);
  }
  // 엘리먼트 생성
  switch (option) {
    case "전체":
    case "월세":
      element = `<div class="filter__option filter__option--deposit">
                      <div class="filter__option-top">
                        <div class="filter__option-title">보증금</div>
                        <div class="filter__option-value">전체</div>
                      </div>
                      <div class="filter__option-main">
                        <input
                          class="filter__input filter__input-deposit filter__input-deposit--min"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="최소금액 (만원단위)"
                          data-type="보증금"
                        />
                        <span>~</span>
                        <input
                          class="filter__input filter__input-deposit filter__input-deposit--max"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="최대금액 (만원단위)"
                          data-type="보증금"
                        />
                      </div>
                    </div>

                    <div class="filter__option filter__option--rent">
                      <div class="filter__option-top">
                        <div class="filter__option-title">월세</div>
                        <div class="filter__option-value">전체</div>
                      </div>
                      <div class="filter__option-main">
                        <input
                          class="filter__input filter__input-rent--min"
                          type="number"
                          min="0"
                          step="10"
                          placeholder="최소금액 (만원단위)"
                          data-type="월세"
                        />
                        <span>~</span>
                        <input
                          class="filter__input filter__input-rent--max"
                          type="number"
                          min="0"
                          step="10"
                          placeholder="최대금액 (만원단위)"
                          data-type="월세"
                        />
                      </div>
                    </div>
                    <div class="filter__option filter__option--manage-cost">
                      <div class="filter__toggle-main">
                        관리비 포함
                        <input type="checkbox" id="toggle-manage-cost" class="toggle" hidden />
                        <label for="toggle-manage-cost" class="toggleSwitch">
                          <span class="toggleButton"></span>
                        </label>
                      </div>
                    </div>`;
      filterOptionContent.insertAdjacentHTML("beforeend", element);
      break;

    case "전세":
      element = `<div class="filter__option filter__option--deposit">
                      <div class="filter__option-top">
                        <div class="filter__option-title">보증금</div>
                        <div class="filter__option-value">전체</div>
                      </div>
                      <div class="filter__option-main">
                        <input
                          class="filter__input filter__input-deposit--min"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="최소금액 (만원단위)"
                          data-type="보증금"
                        />
                        <span>~</span>
                        <input
                          class="filter__input filter__input-deposit--max"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="최대금액 (만원단위)"
                          data-type="보증금"
                        />
                      </div>
                    </div>`;
      filterOptionContent.insertAdjacentHTML("beforeend", element);
      break;
  }
  element = `<div class="filter__btn-box">
              <div class="filter__btn filter__btn--reset">초기화</div>
              <div class="filter__btn filter__btn--apply">
                <i class="fa-solid fa-check"></i>적용
              </div>
            </div>`;
  filterOptionContent.insertAdjacentHTML("beforeend", element);

  // * 생성한 엘리먼트에 이벤트 등록
  // 보증금
  const divDepositValue = filterCategory_price.querySelector(
    ".filter__option--deposit .filter__option-value"
  );
  const depositMin =
    filterCategory_price.querySelector(".filter__input-deposit--min") || null;
  const depositMax =
    filterCategory_price.querySelector(".filter__input-deposit--max") || null;

  // 월세
  const divRentValue = filterCategory_price.querySelector(
    ".filter__option--rent .filter__option-value"
  );
  const rentMin =
    filterCategory_price.querySelector(".filter__input-rent--min") || null;
  const rentMax =
    filterCategory_price.querySelector(".filter__input-rent--max") || null;

  // 관리비 포함여부
  const manageCost = filterCategory_price.querySelector(
    ".filter__option--manage-cost .toggle"
  );

  // 초기화, 적용 버튼
  const resetBtn = filterCategory_price.querySelector(".filter__btn--reset");
  const applyBtn = filterCategory_price.querySelector(".filter__btn--apply");

  if (depositMin) {
    depositMin.addEventListener("change", (e) => {
      // 최소금액이 존재하는 경우
      if (depositMin.value) {
        // 최대금액이 존재하는 경우
        if (depositMax.value) {
          if (Number(depositMin.value) >= Number(depositMax.value)) {
            alert("최소금액은 최대금액보다 작아야합니다.");
            depositMin.value = Number(depositMax.value) - 100;
            if (depositMin.value < 0) depositMin.value = 0;
          }
          divDepositValue.innerText = `${depositMin.value} ~ ${depositMax.value}`;
        }
        // 최대금액이 존재하지 않는 경우
        else {
          divDepositValue.innerText = `${depositMin.value}부터`;
        }
      }
      // 최소금액이 존재하지 않는 경우
      else {
        // 최대금액이 존재하는 경우
        if (depositMax.value) {
          divDepositValue.innerText = `${depositMax.value}까지`;
        }
        // 최대금액이 존재하지 않는 경우
        else {
          divDepositValue.innerText = "전체";
        }
      }
    });
  }

  if (depositMax) {
    depositMax.addEventListener("change", (e) => {
      // 최대금액이 존재하는 경우
      if (depositMax.value) {
        // 최소금액이 존재하는 경우
        if (depositMin.value) {
          if (Number(depositMin.value) >= Number(depositMax.value)) {
            alert("최대금액은 최소금액보다 커야합니다.");
            depositMax.value = Number(depositMin.value) + 100;
          }
          divDepositValue.innerText = `${depositMin.value} ~ ${depositMax.value}`;
        }
        // 최소금액이 존재하지 않는 경우
        else {
          divDepositValue.innerText = `${depositMax.value}까지`;
        }
      }
      // 최대금액이 존재하지 않는 경우
      else {
        // 최소금액이 존재하는경우
        if (depositMin.value) {
          divDepositValue.innerText = `${depositMin.value}부터`;
        }
        // 최소금액이 존재하지 않는 경우
        else {
          divDepositValue.innerText = "전체";
        }
      }
    });
  }

  if (rentMin) {
    rentMin.addEventListener("change", (e) => {
      // 최소금액이 존재하는 경우
      if (rentMin.value) {
        // 최대금액이 존재하는 경우
        if (rentMax.value) {
          if (Number(rentMin.value) >= Number(rentMax.value)) {
            alert("최소금액은 최대금액보다 작아야합니다.");
            rentMin.value = Number(rentMax.value) - 10;
            if (rentMin.value < 0) rentMin.value = 0;
          }
          divRentValue.innerText = `${rentMin.value} ~ ${rentMax.value}`;
        }
        // 최대금액이 존재하지 않는 경우
        else {
          divRentValue.innerText = `${rentMin.value}부터`;
        }
      }
      // 최소금액이 존재하지 않는 경우
      else {
        // 최대금액이 존재하는 경우
        if (rentMax.value) {
          divRentValue.innerText = `${rentMax.value}까지`;
        }
        // 최대금액이 존재하지 않는 경우
        else {
          divRentValue.innerText = "전체";
        }
      }
    });
  }

  if (rentMax) {
    rentMax.addEventListener("change", (e) => {
      // 최대금액이 존재하는 경우
      if (rentMax.value) {
        // 최소금액이 존재하는 경우
        if (rentMin.value) {
          if (Number(rentMin.value) >= Number(rentMax.value)) {
            alert("최대금액은 최소금액보다 커야합니다.");
            rentMax.value = Number(rentMin.value) + 10;
          }
          divRentValue.innerText = `${rentMin.value} ~ ${rentMax.value}`;
        }
        // 최소금액이 존재하지 않는 경우
        else {
          divRentValue.innerText = `${rentMax.value}까지`;
        }
      }
      // 최대금액이 존재하지 않는 경우
      else {
        // 최소금액이 존재하는 경우
        if (rentMin.value) {
          divRentValue.innerText = `${rentMin.value}부터`;
        }
        // 최소금액이 존재하지 않는 경우
        else {
          divRentValue.innerText = "전체";
        }
      }
    });
  }

  // * 초기화, 적용 버튼
  const resetBtnHandler = () => {
    optionBtns_salesType.forEach((optionBtn) => {
      optionBtn.classList.remove("active");
      if (optionBtn.innerText === "전체") optionBtn.classList.add("active");
    });
    createFilterOptionContent_price("전체");
  };

  resetBtn.addEventListener("click", resetBtnHandler);
  applyBtn.addEventListener("click", filterApply_oneroom);
}

//* 필터 : 구조·면적; (원룸, 빌라)
const optionBtns_structure = filterCategory_size.querySelectorAll(
  ".filter__option--structure .filter__option-btn"
);
const optionBtns_floor = filterCategory_size.querySelectorAll(
  ".filter__option--floor .filter__option-btn"
);
const optionTable_size = filterCategory_size.querySelectorAll(
  ".filter__option--size .filter__td"
);
const parkable = filterCategory_size.querySelector(
  ".filter__option--parkable .toggle"
);
const resetBtn_size = filterCategory_size.querySelector(".filter__btn--reset");
const applyBtn_size = filterCategory_size.querySelector(".filter__btn--apply");

optionBtns_structure.forEach((optionBtn) => {
  optionBtn.addEventListener("click", (e) => {
    let totalBtn = optionBtns_structure[0];
    // 노드리스트를 배열로 변환하는 코드
    let div_array = Array.prototype.slice.call(optionBtns_structure);
    let valueArr = [];

    const structureValue = filterCategory_size.querySelector(
      ".filter__option--structure .filter__option-value"
    );

    // 활성화 중인걸 클릭시 활성화 해제, 이때 모두 활성화 해제면 "전체" 활성화
    if (e.currentTarget.classList.contains("active")) {
      e.currentTarget.classList.remove("active");
      if (!div_array.find((btn) => btn.classList.contains("active"))) {
        totalBtn.classList.add("active");
        structureValue.innerText = "전체";
      } else
        structureValue.innerText = div_array.find((btn) =>
          btn.classList.contains("active")
        ).dataset.option;
      return;
    }

    // "전체"가 비활성화 중일때 "전체"를 클릭시 전체만 활성화
    if (
      e.currentTarget === totalBtn &&
      !totalBtn.classList.contains("active")
    ) {
      optionBtns_structure.forEach((btn) => btn.classList.remove("active"));
      totalBtn.classList.add("active");
    }

    // "전체" 외의 버튼 클릭시 "전체"비활성화, 클릭한 버튼 활성화
    if (e.currentTarget !== totalBtn) {
      totalBtn.classList.remove("active");
      e.currentTarget.classList.add("active");
    }

    // 3개옵션 모두 선택시 "전체" 활성화
    if (
      optionBtns_structure[1].classList.contains("active") &&
      optionBtns_structure[2].classList.contains("active") &&
      optionBtns_structure[3].classList.contains("active")
    ) {
      optionBtns_structure.forEach((btn) => btn.classList.remove("active"));
      totalBtn.classList.add("active");
    }

    structureValue.innerText = "";
    div_array.forEach((btn) => {
      if (btn.classList.contains("active")) valueArr.push(btn.dataset.option);
    });
    structureValue.innerText = valueArr.join(", ");
  });
});

optionBtns_floor.forEach((optionBtn) => {
  optionBtn.addEventListener("click", (e) => {
    const floorValue = filterCategory_size.querySelector(
      ".filter__option--floor .filter__option-value"
    );
    const totalBtn = optionBtns_floor[0];

    if (e.currentTarget === totalBtn && totalBtn.classList.contains("acitve")) {
      return;
    }

    optionBtns_floor.forEach((btn) => btn.classList.remove("active"));
    e.currentTarget.classList.add("active");
    floorValue.innerText = e.currentTarget.innerText;
  });
});

optionTable_size.forEach((td) => {
  td.addEventListener("click", (e) => {
    const MIN_INDEX = 1;
    const MAX_INDEX = 7;
    const sizeValue = filterCategory_size.querySelector(
      ".filter__option--size .filter__option-value"
    );
    let array_optionTable_size = Array.prototype.slice.call(optionTable_size);

    if (optionTable_size[0] === e.currentTarget) {
      optionTable_size.forEach((td) => td.classList.remove("active"));
      e.currentTarget.classList.add("active");
      sizeValue.innerText = `${e.currentTarget.innerText}`;
      return;
    }

    // "전체"가 활성화 상태일때
    if (optionTable_size[0].classList.contains("active")) {
      optionTable_size[0].classList.remove("active");
      e.currentTarget.classList.add("active");
      sizeValue.innerText = `${e.currentTarget.innerText}`;
    }
    // "전체" 외의 td 하나가 활성화중일때
    else if (
      array_optionTable_size.filter((td) => td.classList.contains("active"))
        .length === 1
    ) {
      // 원래 활성화 중이던 td
      const prevIndex = array_optionTable_size.findIndex((td) =>
        td.classList.contains("active")
      );
      // 클릭한 td
      const currentIndex = array_optionTable_size.findIndex(
        (td) => e.currentTarget === td
      );

      if (currentIndex < prevIndex) {
        optionTable_size.forEach((td) => td.classList.remove("active"));
        e.currentTarget.classList.add("active");
        sizeValue.innerText = `${e.currentTarget.innerText}`;
      } else if (currentIndex > prevIndex) {
        // 최소~최대인덱스 면 "전체"라는 뜻 "전체"를 활성화
        if (prevIndex === MIN_INDEX && currentIndex === MAX_INDEX) {
          optionTable_size.forEach((td) => td.classList.remove("active"));
          optionTable_size[0].classList.add("active");
          sizeValue.innerText = `${optionTable_size[0].innerText}`;
        }
        // 최소~최대인덱스를 선택하지 않은경우에 prev ~ current까지 활성화
        else {
          for (let i = prevIndex; i <= currentIndex; i++) {
            optionTable_size[i].classList.add("active");
          }

          if (prevIndex === 1)
            sizeValue.innerText = ` ${optionTable_size[currentIndex].innerText} 이하`;
          else if (currentIndex === 7)
            sizeValue.innerText = `${optionTable_size[prevIndex].innerText} 이상 `;
          else
            sizeValue.innerText = `${optionTable_size[prevIndex].innerText} ~ ${optionTable_size[currentIndex].innerText}`;
        }

        // 10평 이하 ~ 10평대 => ~ 10평대 로
        // 10평 이하 ~20 평대 => ~ 20평대
      }
    }
    // "전체" 외의 td 여러개가 활성화중일때
    else {
      optionTable_size.forEach((td) => td.classList.remove("active"));
      e.currentTarget.classList.add("active");
      sizeValue.innerText = `${e.currentTarget.innerText}`;
    }
  });
});

resetBtn_size.addEventListener("click", (e) => {
  const structureValue = filterCategory_size.querySelector(
    ".filter__option--structure .filter__option-value"
  );
  const floorValue = filterCategory_size.querySelector(
    ".filter__option--floor .filter__option-value"
  );
  const sizeValue = filterCategory_size.querySelector(
    ".filter__option--size .filter__option-value"
  );
  const reset = (nodeList) => {
    nodeList.forEach((node) => node.classList.remove("active"));
    nodeList[0].classList.add("active");
  };

  reset(optionBtns_structure);
  reset(optionBtns_floor);
  reset(optionTable_size);

  structureValue.innerText = "전체";
  floorValue.innerText = "전체";
  sizeValue.innerText = "전체";

  parkable.checked = false;
});
applyBtn_size.addEventListener("click", filterApply_oneroom);
//* ========================================== 세권 관련 코드들
const resetBtn_hyperLocal = hyperLocal.querySelector(".filter__btn--reset");
const applyBtn_hyperLocal = hyperLocal.querySelector(".filter__btn--apply");
const chips = hyperLocal.querySelectorAll(".filter__option-chips");

chips.forEach((chip) => {
  chip.addEventListener("click", (e) => {
    e.currentTarget.classList.toggle("active");
  });
});

resetBtn_hyperLocal.addEventListener("click", (e) =>
  chips.forEach((chip) => chip.classList.remove("active"))
);

applyBtn_hyperLocal.addEventListener("click", (e) => {
  removeHyperLocalMarker();

  let clickedCluster = roomCluster._clusters.filter((cluster) =>
    cluster.getClusterMarker().getContent().classList.contains("cluster-click")
  )[0];

  // 클러스터의 중심좌표
  const lat = clickedCluster.getCenter().Ma;
  const lng = clickedCluster.getCenter().La;

  chips.forEach((chip) => {
    if (chip.classList.contains("active")) {
      // 검색할 키워드
      const keyword = chip.dataset.keyword;
      const markerImageName = chip.dataset.marker;

      kakaoSearch
        .search_hyperLocal(keyword, lat, lng)
        .then((data) =>
          data.forEach((item) => createHyperLocalMarker(item, markerImageName))
        );
    }
  });
  createRange(clickedCluster);
});

/**
 * 클러스터를 인자로 받아 클러스터를 기준으로 원(세권의 범위)을 생성한다.
 * @param {*} cluster 원을 생성할 클러스터
 */
function createRange(cluster) {
  let circle250 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 250, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.1, // 채우기 불투명도 입니다
  });
  let circle500 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 500, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.1, // 채우기 불투명도 입니다
  });
  let circle1000 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 1000, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.5, // 채우기 불투명도 입니다
  });

  if (circleList.length !== 0) {
    circleList.forEach((circle) => {
      circle.setMap(null);
    });
    circleList.length = 0;
  }

  circleList.push(circle1000);
  circleList.push(circle500);
  circleList.push(circle250);

  circleList.forEach((circle) => {
    circle.setMap(map);
  });
}

/**
 * 세권 마커를 생성한다.
 * @param {*} data 마커에 대한 정보
 * @param {*} markerImageName 마커의 이미지 이름
 */
function createHyperLocalMarker(data, markerImageName) {
  let address = data.address_name || null;
  // let roadAddress = data.road_address_name || null;
  let place = data.place_name || null;
  let category = data.category_group_name; //주소, 장소, 음식점-카페 등등
  let lat = data.y;
  let lng = data.x;

  let content = "";
  place === null
    ? (content = `<div class="infoWindow__content">
                    <div class="infoWindow__address infoWindow__address-data">${address}</div>
                  </div>`)
    : (content = `<div class="infoWindow__content">
                    <div class="infoWindow__place">${place}</div>
                    <div class="infoWindow__category">${category}</div>
                    <div class="infoWindow__address">${address}</div>
                  </div>`);

  let marker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(lat, lng),
  });

  let markerImage = new kakao.maps.MarkerImage(
    `../../img/map/marker_${markerImageName}.png`,
    new kakao.maps.Size(30, 30),
    new kakao.maps.Point(15, 26)
  );

  marker.setImage(markerImage);

  kakao.maps.event.addListener(marker, "click", function () {
    if (infoWindow) infoWindow.close();
    infoWindow = new kakao.maps.InfoWindow({
      position: new kakao.maps.LatLng(lat, lng),
      content: content,
    });
    let infoWindowBox = infoWindow.a;
    let infoWindowArrow = infoWindow.a.firstElementChild;
    let infoWindowContentBox = infoWindow.Uf;
    infoWindowBox.classList.add("infoWindow-box");
    infoWindowArrow.classList.add("infoWindow__arrow");
    infoWindowContentBox.classList.add("infoWindow__content-box");
    infoWindow.open(map, marker);
  });

  let marekrObj = {
    marker: marker,
    info: data,
  };

  hyperLocalMarkerList.push(marekrObj);
}

/**
 * ^ 세권마커를 모두 삭제한다.
 */
function removeHyperLocalMarker() {
  hyperLocalMarkerList.forEach((obj) => {
    obj.marker.setMap(null);
  });
  hyperLocalMarkerList.length = 0;
}

//* ========================================== NAV 관련 코드들

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

//* ========================================== kakao Map 관련 코드들 ================================================

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  console.log(map.getLevel());
  console.log(roomCluster);
  removeInfoWindow();
});

// 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  overlaySetEvent();
});

// 지도 레벨에 따라 지역, 지하철, 방을 보여준다.
// 보여지는 오버레이에 클릭이벤트를 등록한다.
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  // 5이하 : 매물, 6~8 : 지하철, 9이상 : 지역
  if (5 < map.getLevel() && map.getLevel() < 8) {
    // console.log("지하철 오버레이를 띄워야할때");
    displayOverlay_local_subway(null, map);

    displayRoomCluster(false);
    createCardList();
  } else if (map.getLevel() <= 5) {
    if (roomClusterState) {
      // console.log("줌이 바뀌었는데 방정보 있을때");
      displayRoomCluster(true);
      createCardList();
      displayOverlay_local_subway(null, null);
    } else {
      // console.log("줌이 바뀌었는데 방정보 없을때");
      displayOverlay_local_subway(null, map);
    }
  } else {
    // console.log("로컬 오버레이를 띄워야할때");
    displayOverlay_local_subway(map, null);

    createCardList();
  }

  overlaySetEvent();
});

kakao.maps.event.addListener(map, "rightclick", () => {});

/**
 * 지도를 해당 좌표로 부드럽게 이동시킨다.
 * @param {*} lat
 * @param {*} lng
 */
function panTo(lat, lng) {
  map.panTo(new kakao.maps.LatLng(lat, lng));
}

/**
 * ^ 프로그램 시작시 실행되는 초기화 함수
 * ^ 처음부터 실행되어야할 함수들을 모았다.
 */
function init() {
  createOverlay_subway();
  createOverlay_local(local);
  createCardList();
  createFilterOptionContent_price("전체");
}

init();
