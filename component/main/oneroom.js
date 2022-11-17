const SUBWAY_LIST_URL = "https://apis.zigbang.com/property/biglab/subway/all?";

const 지하철역리스트 = [
  "중곡역",
  "군자역",
  "어린이대공원역",
  "건대입구역",
  "뚝섬유원지역",
  "구의역",
  "강변역",
  "광나루역",
  "아차산역",
];

// 역을 검색해서 찾는걸로 할까?
// 지도를 특정값 이상으로는 더 확대, 축소 못하게 해서 data를 제한
// 만약 100개를 넘어가면 더이상 fetch 안하게 하고, 클러스터에는 100 + 로 표시

// 매물 리스트에는 지도를 더 확대해 주세요를 적자

// 원하는 역정보가 하나일때, 모든 역일때

//! 방의 위도 경도 정보는 있으나 부정확해, 대략적인 위치를 알수있는 정도야
//! 따라서 건물이름이나, 지도가 어느정도 확대되면 주소로 검색을 해서 찍어주고, 클러스터로 나오는 상태면 위도,경도로 사용
/**
 * 한개의 역 id를 찾는 함수
 * @param {*} subwayName id를 찾고자하는 역 이름
 * @returns 역 id
 */
async function getSubwayInfo(subwayName) {
  let response = await fetch(SUBWAY_LIST_URL);
  let data = await response.json();
  let subway = data.find((subway) => subway.name === subwayName);
  return subway.id;
}

/**
 * 역 주변 원룸id를 찾는 함수
 * @param {*} subwayId 원룸을 찾고자하는 역
 * @returns 원룸 id 리스트
 */
async function getRoomIdList(subwayId) {
  let response = await fetch(
    `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
  );
  let data = await response.json();

  // 기존 data를 id만 재정의하여 새 배열을 만들었다.
  let roomIdList = data.list_items.map((room) => {
    return room.simple_item.item_id;
  });
  return roomIdList;
}
/**
 * id에 해당하는 원룸의 상세정보를 찾는 함수
 * @param {*} roomId
 * @returns 원룸의 상세정보
 */
async function getRoomInfo(roomId) {
  let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
  let data = await response.json();
  return data;
}

async function getRoomCoord(roomId) {
  let response = await fetch(`https://apis.zigbang.com/v2/items/${roomId}`);
  let data = await response.json();
  return data;
}

/**
 * 하나의 역 주변 원룸 모든매물의 상세정보를 찾는 함수
 * @param {String} subway 찾을 역 이름
 */
async function getOneRoomData(subway) {
  let subwayId = await getSubwayInfo(subway);

  let roomIdList = await getRoomIdList(subwayId);

  // 모든 방id의 상세정보 찾기  ====== for문을 쓰면 속도는 느리지만 원하는대로 돼 => 아마 async 흐름 안에 또 async가 있다면 그건 새로운 흐름인듯
  // 속도를 포기할수 없어서 forEach를 씀
  // 프로미스 상태에서 해야 모든 것들을 비동기로 계산해. 0.5초정도면 처리됌
  // 프로미스를 안쓰고 for, while 쓰면 반복문 하나하나가 동기로 계산돼 요청1 -> 다음코드, 반복 요청2 -> 다음코드 이런식이라 0.1초 X 요청수 만큼 시간이 필요
  let roomInfo = [];
  roomIdList.forEach((roomId) => {
    roomInfo.push(getRoomInfo(roomId));
  });

  // let coords = roomIdList.map(async (roomId) => {
  //   const data = await getRoomInfo(roomId);
  //   return data.item.random_location.split(",");
  // });
  // Promise.all(coords).then((data) => {
  //   console.log(data);
  // });
  // 1. 방정보를 얻는다.
  // 2. 그중에서 좌표를 얻는다.
  // 3. 좌표들로 배열을 만든다.
  // 4. 클러스터함수(좌표배열) 실행
  return roomInfo;
  // let data = await getRoomCoord(roomIdList);
}

// getOneRoomData("아차산역");

/**
 * 모든 지하철역 주변 매물 탐색
 */
// function getDataAll() {
//   fetch(SUBWAY_LIST_URL)
//     .then((response) => response.json())
//     .then((subwayData) => {
//       for (let i = 0; i < subwayData.length; i++) {
//         // for (let j = 0; j < subwayData.length; j++) {
//         // if (지하철역리스트[i] === subwayData[j].name) {
//         let subwayId = subwayData[i].id;
//         fetch(
//           `https://apis.zigbang.com/v3/items/ad/${subwayId}?subway_id=${subwayId}&radius=1&sales_type=&deposit_s=0&rent_s=0&floor=1~%7Crooftop%7Csemibase&domain=zigbang&detail=false`
//         )
//           .then((response) => response.json())
//           .then((subwayAroundData) => {
//             console.log(subwayAroundData);
//             for (let k = 0; k < subwayAroundData.list_items.length; k++) {
//               if (subwayAroundData.list_items[k].simple_item) {
//                 let roomId = subwayAroundData.list_items[k].simple_item.item_id;
//                 if (k > 200) return;
//                 fetch(`https://apis.zigbang.com/v2/items/${roomId}`)
//                   .then((response) => response.json())
//                   .then((roomData) => {
//                     console.log(roomData);
//                   });
//               }
//             }
//           });
//         // }
//         // }
//       }
//     });
// }
// getDataAll();

export default getOneRoomData;
