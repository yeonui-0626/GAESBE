import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { friendActions } from '../friendSlice';
import { algoActions } from '../../algorithm/algorithmSlice';
import FriendList from './FriendList';
import FriendModal from '../components/FriendModal';
import FriendSecondModal from '../components/FriendSecondModal';
import styled from 'styled-components';
import '../../../components/Common/retroBtn.css';

const FriendSide = styled.div`
  width: 18vw;
  min-width: 12rem;
  height: 100%;
  background-color: #232323;
  color: white;

  z-index: 10;

  animation-name: showToLeft;
  animation-duration: 1s;

  @keyframes showToLeft {
    0% {
      transform: translateX(16vw); /* 애니메이션이 0%만큼 동작시 */
      // 몇 줄을 넣어도 상관없다!!
    }
    50% {
      transform: translateX(-1vw); /* 애니메이션이 50%만큼 동작시 */
    }
    100% {
      transform: translateX(0); /* 애니메이션이 100%만큼 동작시 */
    }
  }
  .sideTitleInvite {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    height: 10%;
    box-sizing: border-box;
    background: #ffffff;
    border: 3px solid #000000;
    border-radius: 10px;
    color: #000000;
    a {
      width: 20%;
    }
  }
  .sideTitle {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 10%;
    box-sizing: border-box;
    background: #ffffff;
    border: 3px solid #000000;
    border-radius: 10px;
    color: #000000;

    .sideTitleImg {
      height: 100%;
    }
    .sideTitleContent {
      font-family: 'NeoDunggeunmo';
      margin-left: 0.8rem;
      font-size: 48px;
      font-weight: 700;
    }
  }
  .sideMain {
    height: 80%;
    background-color: #6f43ff;
    box-sizing: border-box;
    border-top: 3px solid #000000;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    ::-webkit-scrollbar {
      width: 10px;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #2f3542;
      border-radius: 10px;
      background-clip: padding-box;
      border: 2px solid transparent;
    }
    ::-webkit-scrollbar-track {
      background-color: grey;
      border-radius: 10px;
      box-shadow: inset 0px 0px 5px white;
    }
  }
  .friendButtons {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    height: 10%;
    background-color: #6f43ff;
    box-sizing: border-box;
    border-bottom: 3px solid #000000;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    margin-bottom: 1rem;
    .friendButton {
      color: #000000;
      position: relative;
    }
  }
  .isRequest {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f70b0b;
    position: absolute;
    top: -10px;
    right: -10px;
    z-index: 10;
  }
  .chatRoomWrapper {
    z-index: 100;

    position: absolute;
    bottom: 2rem;
    right: 2rem;
    box-sizing: border-box;
    width: 25%;
    height: 40%;
    background: #ffc02d;
    border: 3px solid #000000;
    border-radius: 10px;
  }
  .chatRoom {
    width: 100%;
    height: 100%;
    position: relative;
    .close {
      position: absolute;
      right: 0.8rem;
      top: 0.5rem;

      transition: transform 0.3s;

      :hover {
        transform: scale(1.05);

        cursor: url('/img/cursor/hover_cursor.png'), auto;
      }
    }
    .chatContent {
      overflow-y: auto;
      display: flex;
      flex-direction: column-reverse;
      height: 90%;
      
      ::-webkit-scrollbar {
        width: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background-color: #2f3542;
        border-radius: 10px;
        background-clip: padding-box;
        border: 2px solid transparent;
      }
      ::-webkit-scrollbar-track {
        background-color: grey;
        border-radius: 10px;
        box-shadow: inset 0px 0px 5px white;
      }
      .meBlock {
        display: flex;
        align-items: flex-end;
        margin-left: auto;
        flex-direction: column-reverse;
        margin-right: 0.5rem;
        max-width: 70%;
        padding-top: 1rem;

        .date {
          font-size: smaller;
        }
      }
      .me {
        background: #6f43ff;
        margin-top: 0.3rem;
        margin-bottom: 0.3rem;
        padding: 0.4rem;
        border-radius: 10px;
        word-break: break-all;
      }
      .youBox{
        padding-top: 1rem;
      }
      .you {
        max-width: 70%;
        margin-top: 0.3rem;
        margin-bottom: 0.3rem;
        margin-left: 0.5rem;
        display: flex;
        align-items: flex-start;
      }
      .youProfile {
        /* height: 2rem; */
        width: 2rem;
      }
      .youBlock {
        
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        .youName {
          color: #000000;
        }
        .youMsg {
          background: #ffffff;
          color: #000000;
          padding: 0.4rem;
          border-radius: 10px;
          width: 100%;
          word-break: break-all;
        }
      }
      .youDate {
        font-size: smaller;
        margin-left: 3rem;
      }
    }

    .chatInputs {
      width: 100%;
      height: 9%;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      .chatInput {
        width: 70%;
        height: 100%;
        box-sizing: border-box;
        border: 3px solid #000000;
        border-radius: 10px;
      }
      .chatButton {
        width: 17%;
        height: 100%;
        box-sizing: border-box;
        border: 3px solid #000000;
        border-radius: 10px;
        background: #f0568c;
      }
    }
  }
`;

function FriendMainPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isInvite, setIsInvite] = useState<boolean>(false);
  const [showChatList, setShowChatList] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  const { userInfo } = useSelector((state: any) => state.auth);
  const { friends } = useSelector((state: any) => state.friend);
  const { modal } = useSelector((state: any) => state.friend);
  const { secondModal } = useSelector((state: any) => state.friend);
  const { invitedGameInfo } = useSelector((state: any) => state.friend);
  const { isChatOpen } = useSelector((state: any) => state.friend);
  const { chatFriend } = useSelector((state: any) => state.friend);
  const { chatList } = useSelector((state: any) => state.friend);
  const { alarm } = useSelector((state: any) => state.friend);

  useEffect(() => {
    if (chatFriend && chatList.hasOwnProperty(chatFriend.id)) {
      setShowChatList(chatList[chatFriend.id]);
    } else {
      setShowChatList(null);
    }
  }, [chatFriend, chatList]);

  useEffect(() => {
    if (invitedGameInfo) {
      setIsInvite(true);
    }
  }, [invitedGameInfo]);

  useEffect(() => {
    if (userInfo) {
      dispatch(friendActions.fetchChatStart());
    }
  }, [userInfo]);

  const handleModal = () => {
    dispatch(friendActions.handleModal('request'));
  };

  const handleSecondModal = () => {
    dispatch(friendActions.handleSecondModal());
  };

  const closeModal = () => {
    dispatch(friendActions.handleModal(null));
  };

  const onClickClose = () => {
    dispatch(friendActions.closeChatRoom());
  };

  const onChangeContent = (e: any) => {
    setContent(e.target.value);
  };

  const onSubmitChat = () => {
    dispatch(friendActions.sendChat(content));
    setContent('');
  };

  const onSubmitChat2 = (e: any) => {
    if (e.key === 'Enter') {
      dispatch(friendActions.sendChat(content));
      setContent('');
    }
  };

  useEffect(() => {
    if (isInvite) {
      setIsInvite(false);
      Swal.fire({
        toast: true,
        position: 'top',
        text: `${invitedGameInfo.fromUserNick}님께서 ${invitedGameInfo.inviteGameType} 게임에 초대하였습니다`,

        showCancelButton: true, // cancel버튼 보이기. 기본은 원래 없음
        confirmButtonColor: '#3085d6', // confrim 버튼 색깔 지정
        cancelButtonColor: '#d33', // cancel 버튼 색깔 지정
        confirmButtonText: '승인', // confirm 버튼 텍스트 지정
        cancelButtonText: '취소',
      }).then((result) => {
        if (result.isConfirmed) {
          setIsInvite(false);
          if (invitedGameInfo.inviteGameType === 'algo') {
            if (!userInfo.bjId) {
              Swal.fire({
                icon: 'info',
                text: '백준아이디를 연동해야지만 게임을 할 수 있습니다',
              });
              return;
            }
            const InGameInfo = JSON.parse(invitedGameInfo.inviteRoomCode);
            dispatch(algoActions.enterAlgoRoom(InGameInfo));
            navigate('/game/algo/battle');
            return;
          }
          navigate(`/game/${invitedGameInfo.inviteGameType}/friend`, {
            state: { shareCode: invitedGameInfo.inviteRoomCode },
          });
        } else {
          setIsInvite(false);
        }
      });
    }
  }, [isInvite]);

  return (
    <FriendSide>
      <div className="sideTitle">
        <img
          className="sideTitleImg"
          src="/img/friendEarth.png"
          alt="friendmark"
        />
        <div className="sideTitleContent">Friends</div>
      </div>
      {/* {isInvite && (
        <div className="sideTitle">
          <div onClick={acceptInvite}>수락</div>
          <div onClick={rejectInvite}>거절</div>
        </div>
      )} */}
      <div className="sideMain">
        {modal === 'request' && (
          <FriendModal handleModal={closeModal} type="request" />
        )}
        {secondModal && (
          <FriendSecondModal handleSecondModal={handleSecondModal} />
        )}
        {friends ? <FriendList /> : <div>친구창이 조용합니다...</div>}
      </div>
      <div className="friendButtons">
        <div
          className="friendButton eightbit-btn eightbit-btn--proceed"
          onClick={handleModal}
        >
          친구신청
        </div>
        <div
          className="friendButton eightbit-btn eightbit-btn--proceed"
          onClick={handleSecondModal}
        >
          {alarm && <div className="isRequest"></div>}
          대기목록
        </div>
      </div>
      {isChatOpen && (
        <div className="chatRoomWrapper">
          <div className="chatRoom">
            <img
              src="/img/close.png"
              onClick={onClickClose}
              className="close"
              alt="close"
            />
            <div className="chatContent">
              {showChatList &&
                Object.keys(showChatList).length !== 0 &&
                userInfo &&
                showChatList.map((chat: any, idx: number) =>
                  chat.from === userInfo.id ? (
                    <div key={idx} className="meBlock">
                      <div className="date">{chat.date.slice(11, 16)}</div>
                      <div className="me">{chat.msg}</div>
                    </div>
                  ) : (
                    <div className="youBox" key={idx}>
                      <div className="you">
                        <img
                          className="youProfile"
                          src={`${process.env.REACT_APP_S3_URL}/profile/${chatFriend.profileChar}_normal.gif`}
                        />
                        <div className="youBlock">
                          <div className="youName">{chatFriend.nickname}</div>
                          <div className="youMsg">{chat.msg}</div>
                        </div>
                      </div>
                      <div className="youDate">{chat.date.slice(11, 16)}</div>
                    </div>
                  ),
                )}
            </div>
            <div className="chatInputs">
              <input
                onChange={onChangeContent}
                onKeyDown={onSubmitChat2}
                className="chatInput"
                value={content}
                type="text"
              />
              <button onClick={onSubmitChat} className="chatButton">
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </FriendSide>
  );
}
export default FriendMainPage;
