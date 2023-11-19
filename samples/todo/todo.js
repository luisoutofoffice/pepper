// app states
const todos = ["hi"]


// HTML REF
const addTodoInput = document.getElementById('todo-input');
const addTodoButton = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');

// Init View
for(const todo of todos){
    todoList.append(renderTodoInReadMode(todo))
}

addTodoInput.addEventListener('input', () => { 
    console.log("hi")
    addTodoButton.disabled = addTodoInput.value.length < 3
})
  
addTodoInput.addEventListener('keydown',({key})=>{
    if(key === 'Enter' && addTodoInput.ariaValueMax.length >=3){
        // addTodo();
        console.log(key)
    }
})

addTodoButton.addEventListener('click', ()=>{
    addTodo();
})

// Functions
function renderTodoInReadMode(todo) {
    // TODO: implement me!
  }
  
  function addTodo() {
    // TODO: implement me!
  }