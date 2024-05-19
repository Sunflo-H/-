import { getPyeong } from "./etc.js";
import kakaoMap from "./kakaoMap.js";
import { createRoomSection } from "./oneroom.js";

const filterCategories = document.querySelectorAll(".filter__category");
const filterCategory_price = filterCategories[0];
const filterCategory_size = filterCategories[1];

/**
 * 유형 · 금액, 구조 · 면적 필터를 동시에 사용하기 위해 필터한 roomData를 저장하는 객체
 */
let filteredRoomData = { price: [], structure: [] };

// * 유형 · 금액 필터의 변수
/**
 * 거래유형(전체, 전세, 월세) 버튼
 */
const optionBtns_salesType = filterCategory_price.querySelectorAll(
  ".filter__option--price .filter__option-btn"
);
// 초기화, 적용 버튼
const resetBtn_price = filterCategory_price.querySelector(
  ".filter__btn--reset"
);
const applyBtn_price = filterCategory_price.querySelector(
  ".filter__btn--apply"
);

/**
 * 거래유형 중 선택된 값
 */
const salesTypeValue = filterCategory_price.querySelector(
  ".filter__option--price .filter__option-value"
);

// * 구조 · 면적 필터의 변수
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
const resetBtn_structure = filterCategory_size.querySelector(
  ".filter__btn--reset"
);
const applyBtn_structure = filterCategory_size.querySelector(
  ".filter__btn--apply"
);

/**
 * ^ 필터 버튼을 클릭 가능한 상태로 만드는 함수
 */
function ableFilterBtn() {
  filterCategory_price.classList.remove("disable");
  filterCategory_size.classList.remove("disable");
}

/**
 * ^ 필터 버튼을 클릭 불가능한 상태로 만드는 함수
 */
function disableFilterBtn() {
  filterCategory_price.classList.add("disable");
  filterCategory_size.classList.add("disable");
}

function applyBtnHandler_price() {
  console.log(1);
  // 보증금
  const depositMin = filterCategory_price.querySelector(
    ".filter__input-deposit--min"
  );
  const depositMax = filterCategory_price.querySelector(
    ".filter__input-deposit--max"
  );

  // 월세
  const rentMin = filterCategory_price.querySelector(
    ".filter__input-rent--min"
  );
  const rentMax = filterCategory_price.querySelector(
    ".filter__input-rent--max"
  );

  // 관리비 포함여부
  const manageCost = filterCategory_price.querySelector(
    ".filter__option--manage-cost .toggle"
  );

  let salesType = salesTypeValue.dataset.value;

  let roomData = kakaoMap
    .getOriginalRoomAndMarker()
    .map((item) => item.roomData);

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
  result = result.filter((room) => {
    if (parkable.checked) {
      if (room.item.parking !== "불가능") return room;
    } else return room;
  });

  filteredRoomData.price = result;

  let filteredDataList = [];
  if (filteredRoomData.structure.length !== 0) {
    filteredRoomData.price.forEach((roomData_price) => {
      filteredRoomData.structure.find((roomData_structure) => {
        if (roomData_price === roomData_structure)
          filteredDataList.push(roomData_price);
      });
    });
  }

  kakaoMap.removeCluster();
  filteredRoomData.structure.length === 0
    ? kakaoMap.createCluster(result)
    : kakaoMap.createCluster(filteredDataList);

  // 필터를 적용하면 기존에 열려있던 클러스터의 매물 리스트를 닫는다.
  createRoomSection(null);
  const detailBox = document.querySelector(".detail-box");
  detailBox.classList.remove("open");
}

function applyBtnHandler_structure() {
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
  let roomData = kakaoMap
    .getOriginalRoomAndMarker()
    .map((item) => item.roomData);

  let result = roomData.filter((room) => {
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
      if (pyeong >= str.slice(0, 2)) return room;
    }
    // n평 ~ m평 인경우
    else if (str.includes("~")) {
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
    if (parkable.checked) {
      if (room.item.parking !== "불가능") return room;
    } else return room;
  });

  filteredRoomData.structure = result;

  let filteredDataList = [];
  if (filteredRoomData.price.length !== 0) {
    filteredRoomData.price.forEach((roomData_price) => {
      filteredRoomData.structure.find((roomData_structure) => {
        if (roomData_price === roomData_structure)
          filteredDataList.push(roomData_price);
      });
    });
  }

  kakaoMap.removeCluster();
  filteredRoomData.price.length === 0
    ? kakaoMap.createCluster(result)
    : kakaoMap.createCluster(filteredDataList);

  createRoomSection(null);
  const detailBox = document.querySelector(".detail-box");
  detailBox.classList.remove("open");
}
/**
 * - 필터 중 거래유형(전체,월세, 전세)에 대한 보증금, 월세, 관리비 option-content element를 생성하고 이벤트를 등록하는 함수
 * - 이 필터는 컨텐츠가 동적으로 생성되야 하기 때문에 함수를 사용했다.
 * @param {*} option "전체" or "월세" or "전세"
 */
function createFilterOptionContent_price(option) {
  const filterOptionContent = document.querySelector(".filter__option-content");
  let element = "";

  while (filterOptionContent.firstChild) {
    filterOptionContent.removeChild(filterOptionContent.firstChild);
  }

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
      break;
  }
  filterOptionContent.insertAdjacentHTML("beforeend", element);

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

  const depositMin = filterCategory_price.querySelector(
    ".filter__input-deposit--min"
  );
  const depositMax = filterCategory_price.querySelector(
    ".filter__input-deposit--max"
  );

  // 월세
  const divRentValue = filterCategory_price.querySelector(
    ".filter__option--rent .filter__option-value"
  );

  const rentMin = filterCategory_price.querySelector(
    ".filter__input-rent--min"
  );
  const rentMax = filterCategory_price.querySelector(
    ".filter__input-rent--max"
  );

  // 초기화, 적용 버튼
  const resetBtn_price = filterCategory_price.querySelector(
    ".filter__btn--reset"
  );
  const applyBtn_price = filterCategory_price.querySelector(
    ".filter__btn--apply"
  );

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

  // * 새로 생성된 초기화, 적용 버튼에 이벤트 등록

  resetBtn_price.addEventListener("click", (e) => {
    // 모든 거래유형 버튼에 active 제거 후 '전체'만 활성화
    optionBtns_salesType.forEach((optionBtn) => {
      optionBtn.classList.remove("active");
      if (optionBtn.innerText === "전체") optionBtn.classList.add("active");
    });
    salesTypeValue.innerText = "전체";
    salesTypeValue.dataset.value = "전체";
    createFilterOptionContent_price("전체");
  });
  applyBtn_price.addEventListener("click", applyBtnHandler_price);
}

resetBtn_price.addEventListener("click", (e) => {
  console.log("리셋");
  // 모든 거래유형 버튼에 active 제거 후 '전체'만 활성화
  optionBtns_salesType.forEach((optionBtn) => {
    optionBtn.classList.remove("active");
    if (optionBtn.innerText === "전체") optionBtn.classList.add("active");
  });
  salesTypeValue.innerText = "전체";
  salesTypeValue.dataset.value = "전체";
  createFilterOptionContent_price("전체");
});
applyBtn_price.addEventListener("click", applyBtnHandler_price);

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

optionBtns_salesType.forEach((optionBtn) => {
  optionBtn.addEventListener("click", (e) => {
    // 옵션버튼들을 순회하면서 모든 active를 지움
    optionBtns_salesType.forEach((optionBtn_inner) =>
      optionBtn_inner.classList.remove("active")
    );

    // 클릭한 옵션버튼에 active 추가
    e.currentTarget.classList.add("active");

    // 해당 버튼을 클릭했음을 상단에 값으로 알려준다.
    salesTypeValue.dataset.value = e.currentTarget.dataset.option;
    salesTypeValue.innerText = salesTypeValue.dataset.value;
    createFilterOptionContent_price(salesTypeValue.dataset.value);
  });
});

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

resetBtn_structure.addEventListener("click", (e) => {
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

applyBtn_structure.addEventListener("click", applyBtnHandler_structure);

export default {
  createFilterOptionContent_price,
  disableFilterBtn,
  ableFilterBtn,
};
