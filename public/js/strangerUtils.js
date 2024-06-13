import * as wss from './wss.js';
import * as webRTCHandler from './webRTCHandler.js';
import * as ui from './ui.js';

let strangerCallType;

export const changeStrangerConnectionStatus = (status) => {
  const selectedTopics = localStorage.getItem('selectedTopics') || [];
  const data = { status, selectedTopics };
  wss.changeStrangerConnectionStatus(data);
};

export const getStrangerSocketIdAndConnect = (callType) => {
  strangerCallType = callType;
  const selectedTopics = localStorage.getItem('selectedTopics') || [];
  wss.getStrangerSocketId(selectedTopics);
};

export const connectWithStranger = (data) => {
  console.log(data.randomStrangerSocketId);

  if (data.randomStrangerSocketId) {
    webRTCHandler.sendPreOffer(strangerCallType, data.randomStrangerSocketId);
  } else {
    // no user is available from connection
    ui.showNoStrangerAvailableDiolog();
  }
};
