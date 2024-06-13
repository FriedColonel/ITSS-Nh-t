const express = require('express');
const http = require('http');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// compare function that need to pair matched user
const compare = (arr1, arr2) => {
  if (arr1.includes('tấtcả') || arr2.includes('tấtcả')) {
    return true;
  }
  const result = arr1.reduce((result, item) => result + arr2.includes(item), 0);
  return result;
};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let connectedPeers = [];
let connectedPeersStrangers = [];

io.on('connection', socket => {
  connectedPeers.push({ id: socket.id, selectedTopics: [] });

  socket.on('pre-offer', data => {
    console.log('pre-offer-came');
    const { calleePersonalCode, callType } = data;
    console.log(calleePersonalCode);
    console.log(connectedPeers);
    const connectedPeer = connectedPeers.find(
      peerSocket => peerSocket.id === calleePersonalCode,
    );

    console.log(connectedPeer);

    if (connectedPeer) {
      const data = {
        callerSocketId: socket.id,
        callType,
      };
      io.to(calleePersonalCode).emit('pre-offer', data);
    } else {
      const data = {
        preOfferAnswer: 'CALLEE_NOT_FOUND',
      };
      io.to(socket.id).emit('pre-offer-answer', data);
    }
  });

  socket.on('pre-offer-answer', data => {
    const { callerSocketId } = data;

    const connectedPeer = connectedPeers.find(
      peerSocket => peerSocket.id === callerSocketId,
    );

    if (connectedPeer) {
      io.to(data.callerSocketId).emit('pre-offer-answer', data);
    }
  });

  socket.on('webRTC-signaling', data => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      peerSocket => peerSocket.id === connectedUserSocketId,
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit('webRTC-signaling', data);
    }
  });

  socket.on('user-hanged-up', data => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      peerSocket => peerSocket.id === connectedUserSocketId,
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit('user-hanged-up');
    }
  });

  socket.on('stranger-connection-status', data => {
    const { status } = data;
    const selectedTopics = JSON.parse(data.selectedTopics);

    if (status) {
      connectedPeersStrangers.push({ id: socket.id, selectedTopics });
    } else {
      const newConnectedPeersStrangers = connectedPeersStrangers.filter(
        peerSocket => peerSocket.id !== socket.id,
      );
      connectedPeersStrangers = newConnectedPeersStrangers;
    }

    console.log(connectedPeersStrangers);
  });

  socket.on('get-stranger-socket-id', data => {
    let randomStrangerSocketId;
    const filterConnectedPeersStrangers = connectedPeersStrangers.filter(
      peerSocket =>
        peerSocket.id !== socket.id &&
        compare(peerSocket.selectedTopics, data.selectedTopics),
    );

    console.log(
      'filterConnectedPeersStrangers: ',
      filterConnectedPeersStrangers,
    );

    if (filterConnectedPeersStrangers.length > 0) {
      randomStrangerSocketId =
        filterConnectedPeersStrangers[
          Math.floor(Math.random() * filterConnectedPeersStrangers.length)
        ].id;
    } else {
      randomStrangerSocketId = null;
    }

    data = {
      randomStrangerSocketId,
    };

    io.to(socket.id).emit('stranger-socket-id', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');

    const newConnectedPeers = connectedPeers.filter(
      peerSocket => peerSocket.id !== socket.id,
    );

    connectedPeers = newConnectedPeers;
    //console.log(connectedPeers);

    const newConnectedPeersStrangers = connectedPeersStrangers.filter(
      peerSocket => peerSocket.id !== socket.id,
    );
    connectedPeersStrangers = newConnectedPeersStrangers;
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
