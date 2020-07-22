let socket = io()

//Elements
// here $ is just indicating that these are elements,it has no special meaning 
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML


//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = () => {  
    //new message element
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I come from top
    const scrolloffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrolloffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage', (location) => {
    console.log(location)
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    console.log(room, users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

socket.on("message", (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    let message = event.target.elements.message.value
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log("Message delivered!")
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        $sendLocationButton.removeAttribute('disabled')
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log("Location shared!")
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

