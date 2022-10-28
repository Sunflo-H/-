const filter = document.querySelectorAll('.filter');
const size = filter[0];
const year = filter[1];
const people = filter[2];
const sizeSelect = size.querySelector('.filter__select');
const sizeOption = size.querySelector('.filter__option-table');
const sizeOptionItem = size.querySelectorAll('.filter__option');
// const yearSelect = year.querySelector('.filter__select');
// const yearOption = year.querySelector('.filter__option-wrapper');
// const yearOptionItem = year.querySelectorAll('.filter__option');
// const peopleSelect = people.querySelector('.filter__select');
// const peopleOption = people.querySelector('.filter__option-wrapper');
// const peopleOptionItem = people.querySelectorAll('.filter__option');

// !같은 코드가 반복돼
// 지금은 css 하는 중이라 안했는데
// 나중에 기능 만들때 반복문으로 고쳐보자
sizeSelect.addEventListener('click', e=> {
    sizeOption.style.display = "block";
})

// yearSelect.addEventListener('click', e=> {
//     yearOption.style.display = "block";
// })

// peopleSelect.addEventListener('click', e=> {
//     peopleOption.style.display = "block";
// })

document.addEventListener('click', e=> {
    if(e.target !== sizeSelect) sizeOption.style.display = "none";
    // if(e.target !== yearSelect) yearOption.style.display = "none";
    // if(e.target !== peopleSelect) peopleOption.style.display = "none";
})

