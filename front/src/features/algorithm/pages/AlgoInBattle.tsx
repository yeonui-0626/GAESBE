import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import Swal from 'sweetalert2';

import { algoActions } from '../algorithmSlice';
import { bojUserIdRequest } from '../../../api/algoApi';
import { usePrompt } from '../../../utils/block';
import {
  InGameUsersInterface,
  ProblemInterface,
  RankingUserInfo,
} from '../../../models/algo';

import AlgoBeforeStart from '../components/AlgoBeforeStart';
import AlgoAfterStart from '../components/AlgoAfterStart';
import styled from 'styled-components';

interface CustomWebSocket extends WebSocket {
  _transport?: any;
}

const Wrapper = styled.div`
  height: 100%;
  width: 90%;
  display: flex;
  flex-direction: column;
  justify-items: center;
  margin: auto;
  .title {
    text-align: center;
    height: 18%;
    img {
      width: 60%;
    }
  }
  .content {
    height: 100%;
  }
`;

function AlgoInBattle() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { InGameInfo } = useSelector((state: any) => state.algo);
  const { userInfo } = useSelector((state: any) => state.auth);

  const [inGameUsers, setInGameUsers] = useState<InGameUsersInterface[]>([]);
  const [progress, setProgress] = useState<string>('before');
  const [afterProgress, setAfterProgress] = useState<string>('select');
  const [problemList, setProblemList] = useState<ProblemInterface[]>([]);
  const [problemIndex, setProblemIndex] = useState<number>(0);
  const [ranking, setRanking] = useState<RankingUserInfo[]>([]);
  const [myRank, setMyRank] = useState<number>(5);
  const [timeOut, setTimeOut] = useState<boolean>(false);
  const [msgAlert, setMsgAlert] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    for (let i = 0; i < 4; i++) {
      if (ranking[i]) {
        if (ranking[i].userId === userInfo.id) {
          setMyRank(i + 1);
          break;
        }
      }
    }
  }, [ranking]);

  useEffect(() => {
    if (msgAlert) {
      Swal.fire({
        toast: true,
        position: 'top',
        timer: 1000,
        showConfirmButton: false,
        text: msg,
      });
    }
  }, [msg]);

  const client = useRef<any>(null);
  // ?????? ????????? ?????? ??????, ??????id?????????
  useEffect(() => {
    if (InGameInfo === null) {
      navigate('/game/algo');
    } else {
      const socket: CustomWebSocket = new SockJS(
        'https://k7e104.p.ssafy.io:8081/api/ws',
      );
      client.current = Stomp.over(socket);
      // ?????? ??????????????? ?????? ?????? ??????
      if (process.env.NODE_ENV !== 'development') {
        client.current.debug = function () {};
      }
      // ???????????? ?????? ??????
      client.current.connect({ userId: userInfo.id }, (frame: any) => {
        // ??????, ?????? ?????? ????????? ?????? ??????
        client.current.subscribe(
          `/algo/room/${InGameInfo.roomCode}`,
          (res: any) => {
            if (progress === 'before') {
              setMsg(JSON.parse(res.body).msg);
              setMsgAlert(true);
              setInGameUsers(JSON.parse(res.body).users);
              const newGameInfo = JSON.parse(JSON.stringify(InGameInfo));
              newGameInfo.master = JSON.parse(res.body).master;
              dispatch(algoActions.enterAlgoRoomSuccess(newGameInfo));
            }
          },
        );

        // ?????? ?????? ?????? ????????? ?????? ??????
        client.current.subscribe(
          `/algo/start/pass/${InGameInfo.roomCode}`,
          (res: any) => {
            if (JSON.parse(res.body).type === 'START') {
              dispatch(algoActions.setLoadingMsg('START'));
            } else {
              setProblemList(JSON.parse(res.body).problems);
              if (JSON.parse(res.body).master == userInfo.id) {
                client.current.send(
                  `/api/algo/timer`,
                  {},
                  JSON.stringify({ roomCode: InGameInfo.roomCode }),
                );
              }
              dispatch(algoActions.setLoadingMsg(''));
              setProgress('after');
            }
          },
        );

        // ?????? ?????? ????????? ??????
        client.current.subscribe(
          `/algo/pass/${InGameInfo.roomCode}`,
          (res: any) => {
            if (JSON.parse(res.body).no) {
              setProblemIndex(JSON.parse(res.body).no);
            }
            if (JSON.parse(res.body).master == userInfo.id) {
              client.current.send(
                `/api/algo/timer`,
                {},
                JSON.stringify({ roomCode: InGameInfo.roomCode }),
              );
            }
          },
        );

        // ?????? ?????? ????????? ??????
        client.current.subscribe(
          `/algo/problem/${InGameInfo.roomCode}`,
          (res: any) => {
            if (JSON.parse(res.body).type === 'FINISH') {
              setTimeOut(true);
            } else {
              setProblemIndex(JSON.parse(res.body).no);
              setAfterProgress('solve');
            }
          },
        );

        // ?????? ????????? ??????
        client.current.subscribe(
          `/algo/rank/${InGameInfo.roomCode}`,
          (res: any) => {
            const rankingInfo = JSON.parse(res.body);
            setRanking(rankingInfo.ranking);
          },
        );

        // ???????????? ??????????????? ?????????
        client.current.send(
          '/api/algo',
          {},
          JSON.stringify({
            type: 'ENTER',
            sessionId: socket._transport.url.slice(-18, -10),
            userId: userInfo.id,
            nickname: userInfo.nickname,
            roomCode: InGameInfo.roomCode,
          }),
        );
      });
      // ?????? ????????? ?????????, ????????? ???????????????
      bojUserIdRequest(InGameInfo.roomCode, userInfo.bjId);
      return () => {
        leaveRoom();
      };
    }
  }, []);

  // ???????????? ?????? useEffect
  useEffect(() => {
    const preventGoBack = () => {
      // change start
      window.history.pushState(null, '', window.location.href);
      // change end
      Swal.fire({
        icon: 'error',
        text: '??????????????? ?????? ??? ????????????',
      });
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventGoBack);
    return () => window.removeEventListener('popstate', preventGoBack);
  }, []);
  // ???????????? ?????? useEffect
  // ????????????, ?????????, ???????????? ?????? ????????? ????????? ???????????? confirm ?????????
  usePrompt(
    '???????????? ????????? ????????? ???????????? ????????????',
    progress === 'after' && !timeOut && myRank === 5,
  );
  // ????????????, ?????????, ???????????? ?????? ????????? ????????? ???????????? confirm ?????????

  // ??? ?????????
  const leaveRoom = async () => {
    // ?????? ??????
    await client.current.disconnect(() => {});
    // ???????????? ??? ?????? ?????????
    await dispatch(algoActions.exitAlgoRoom());
  };
  // ??? ????????? ???

  const handleLeaveRoom = () => {
    navigate('/game/algo');
  };

  // ?????? ???????????? ?????? ???????????????
  const startGame = () => {
    const userBjIds = inGameUsers.map((user: InGameUsersInterface) => {
      return user.bjId;
    });
    client.current.send(
      `/api/algo/start/pass`,
      {},
      JSON.stringify({
        tier: InGameInfo.tier,
        roomCode: InGameInfo.roomCode,
        users: userBjIds,
      }),
    );
  };

  return (
    <>
      {InGameInfo && (
        <Wrapper>
          <h1 className="title">
            <img src={`/img/gametitle/gametitle4.png`}></img>
          </h1>
          <div className="content">
            {progress === 'before' && (
              <AlgoBeforeStart
                client={client}
                handleLeaveRoom={handleLeaveRoom}
                startGame={startGame}
                inGameUsers={inGameUsers}
              />
            )}
            {progress === 'after' && (
              <AlgoAfterStart
                ranking={ranking}
                handleLeaveRoom={handleLeaveRoom}
                inGameUsers={inGameUsers}
                progress={afterProgress}
                client={client}
                problemList={problemList}
                problemIndex={problemIndex}
                myRank={myRank}
                timeOut={timeOut}
              />
            )}
          </div>
        </Wrapper>
      )}
    </>
  );
}
export default AlgoInBattle;
