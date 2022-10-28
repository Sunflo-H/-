const filter = document.querySelector('.filter');
const size = filter;
const sizeSelect = size.querySelector('.filter__select');
const sizeOption = size.querySelector('.filter__option-table');
const sizeOptionItem = size.querySelectorAll('.filter__option');

const slider = filter.querySelector('.filter__slider-bottom input');

console.log(slider);
sizeSelect.addEventListener('click', e=> {
    sizeOption.style.display = "block";
})



document.addEventListener('click', e=> {
    if(e.target !== sizeSelect) sizeOption.style.display = "none";

})

// function ShowSliderValue(sVal){
//     var obValueView = document.getElementById("slider_value_view");
//         obValueView.innerHTML = sVal
// }
// var RangeSlider = function(){
//     var range = $('.slider_range');
//     range.on('input', function(){
//         ShowSliderValue(this.value);
//     });
// };
// RangeSlider();

