// const itemsList = document.getElementById("items")
// const newListItem = document.createElement("li")

// newListItem.textContent = "item 3"
// // itemsList.appendChild(newListItem)
// setTimeout(()=>itemsList.appendChild(newListItem),3000)

const countElement = document.getElementById("count");

function setCount(){
    let count=Number(countElement.textContent);
    count++
    countElement.textContent = count
}