import React, { useCallback, useEffect, useState } from 'react'
import './lobby.css'
import { useSocket } from '../../context/SocketProvider';
import { useNavigate } from 'react-router-dom';
const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("")
  const socket = useSocket()
  const navigate=useNavigate()

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    socket.emit('room:join', { email, room })
   
  }, [room, email, socket])

  useEffect(() => {
    socket.on('room:join', handleJoinRoom)
    return()=>socket.off('room:join', handleJoinRoom)
  }, [socket])

  const handleJoinRoom = useCallback((data) => {
  const {email,room}=data 
  navigate(`/room/${room}`)

  }, [navigate])
  return (
    <div className='container'>
      <div className='wrapper'>
        <h1>Lobby</h1>
        <form className='form' onSubmit={handleSubmit}>
          <label htmlFor="email">Email ID</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <label htmlFor="room">Room</label>
          <input
            type="text"
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <br />
          <button type="submit">Join</button>
        </form>
      </div>
    </div>

  )
}

export default Lobby
