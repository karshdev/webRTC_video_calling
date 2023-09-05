import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketProvider'
import peer from '../../service/Peer'
import ReactPlayer from "react-player"
const Room = () => {
  const socket = useSocket()
  const [remoteSocketId, setremoteSocketId] = useState(null)
  const [myStream, setmyStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null);
  const handleUserJoined = useCallback((data) => {
    const { email, id } = data
    console.log(`use joined${email}`)
    setremoteSocketId(id)
  }, [])
  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setremoteSocketId(from)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    setmyStream(stream)
    console.log(`incoming call ${from}`, offer);
    const ans = await peer.getAnswer(offer)
    socket.emit('call:accepted', { to: from, ans })
    
  }, [socket])
  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);
  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans)
    console.log('call accepted!!');
    sendStreams();
  }, [sendStreams])
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);
  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);
  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);
  useEffect(() => {
    socket.on("user:joined", handleUserJoined)
    socket.on("incoming:call", handleIncomingCall)
    socket.on("call:accepted", handleCallAccepted)
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    return () => {
      socket.off("user:joined", handleUserJoined)
      socket.off("incoming:call", handleIncomingCall)
      socket.off("call:accepted", handleCallAccepted)
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    }
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeedIncomming, handleNegoNeedFinal])

  const handleCallUSer = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    const offer = await peer.getOffer()
    socket.emit('user:call', { to: remoteSocketId, offer })
    setmyStream(stream)
  }, [remoteSocketId, socket])

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);
  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? 'Connected' : 'Room not found'}</h4>
      {
        remoteSocketId && <button onClick={handleCallUSer}>Call</button>
      }
       {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {
        myStream && <ReactPlayer url={myStream} playing />
      }
      {
        remoteStream && <ReactPlayer url={remoteStream} playing  />
      }
    </div>
  )
}

export default Room
