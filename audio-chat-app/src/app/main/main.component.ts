import { Component, OnInit, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit, OnDestroy {
  messageText: string = '';
  private socket!: Socket;
  private myVideo!: HTMLVideoElement;
  public videoGrid!: HTMLDivElement;
  private myVideoStream!: MediaStream;
  private peer!: Peer;

  user: string = '';
  showChat: boolean = false;
  isMuted: boolean = false;
  isVideoOff: boolean = false;
  messages: { userName: string; text: string }[] = [];

  // Define the ROOM_ID
  private readonly ROOM_ID = 'CALLING_ROOM';

  constructor() {
    this.socket = io('http://localhost:3030/');
  }

  ngOnInit(): void {
    this.videoGrid = document.getElementById('video-grid') as HTMLDivElement;
    this.myVideo = document.createElement('video');
    this.myVideo.muted = true;

    this.user = prompt('Enter your name') || '';

    // Step 1: Initialize Peer and Socket.IO connection
    this.initPeer();
    this.initSocket();

    // Step 2: Get user media and add local video stream
    this.initVideoConference();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    this.peer.destroy();
    this.myVideoStream.getTracks().forEach((track) => track.stop());
  }

  initPeer() {
    this.peer = new Peer({
      host: 'localhost',
      port: 3030,
      path: '/peerjs',
      config: {
        iceServers: [
          { urls: 'stun:stun01.sipphone.com' },
          { urls: 'stun:stun.ekiga.net' },
          { urls: 'stun:stunserver.org' },
          { urls: 'stun:stun.softjoys.com' },
          { urls: 'stun:stun.voiparound.com' },
          { urls: 'stun:stun.voipbuster.com' },
          { urls: 'stun:stun.voipstunt.com' },
          { urls: 'stun:stun.voxgratia.org' },
          { urls: 'stun:stun.xten.com' },
          {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808',
          },
          {
            urls: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808',
          },
        ],
      },
      debug: 3,
    });

    this.peer.on('open', (id) => {
      console.log('My Peer ID:', id);
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS Error:', err);
    });
  }

  initSocket() {
    // Step 3: Initialize the Socket.IO connection
    this.socket = io('http://localhost:3030/');

    this.socket.on('createMessage', (message, userName) => {
      this.messages.push({ userName, text: message });
    });

    this.socket.on('user-disconnected', (userId: any) => {
      const videoElement = this.videoGrid.querySelector(
        `video[data-user-id="${userId}"]`
      );
      if (videoElement) {
        videoElement.remove();
      }
    });

    this.socket.on('disconnect', () => {
      const videoElements = this.videoGrid.querySelectorAll('video');
      videoElements.forEach((video) => video.remove());
    });
  }

  initVideoConference() {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        this.myVideoStream = stream;
        this.addVideoStream(this.myVideo, stream);

        // Step 4: Create offer after getting user media
        this.createOffer();

        this.socket.on('user-connected', (userId: any) => {
          this.connectToNewUser(userId, stream);
        });
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });
  }

  createOffer() {
    this.peer.on('call', (call) => {
      console.log('Someone called me');
      call.answer(this.myVideoStream);
      const video = document.createElement('video');
      call.on('stream', (userVideoStream) => {
        this.addVideoStream(video, userVideoStream);
      });
    });

    this.socket.emit('join-room', this.ROOM_ID, this.peer.id, this.user);
  }

  connectToNewUser(userId: string, stream: MediaStream) {
    const call = this.peer.call(userId, stream);
    const video = document.createElement('video');
    video.dataset['userId'] = userId;
    call.on('stream', (userVideoStream) => {
      this.addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      video.remove();
    });
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
      if (this.videoGrid) {
        this.videoGrid.append(video);
      } else {
        console.error('videoGrid element not found.');
      }
    });
  }

  toggleChat() {
    this.showChat = !this.showChat;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.myVideoStream) {
      this.myVideoStream.getAudioTracks()[0].enabled = !this.isMuted;
    }
  }

  toggleVideo() {
    this.isVideoOff = !this.isVideoOff;
    if (this.myVideoStream) {
      this.myVideoStream.getVideoTracks()[0].enabled = !this.isVideoOff;
    }
  }

  invitePeople() {
    const peerId = this.peer.id; // Get the peer ID generated earlier
  
    // Generate the URL with the peer ID included as a query parameter
    const urlWithPeerId = window.location.href + '?peerId=' + peerId;
  
    prompt('Copy this link and send it to people you want to meet with', urlWithPeerId);
  }
  

  sendMessage(message: string) {
    this.socket.emit('message', message);
    this.messageText = ''; // Clear the chat input
  }
}


