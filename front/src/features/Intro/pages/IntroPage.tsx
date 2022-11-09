import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;
  background-color: #232323;

  .introImg {
    position: relative;
    height: 100vh;
    width: 100%;
  }
  .inner {
    max-width: 1100px;
    height: 100%;
    margin: 0 0;
  }
  .introBox {
    position: relative;
    height: 500px;
    background-color: #232323;
  }
  .txt01 {
    max-width: 70%;
    margin: 0 auto;
    font-family: 'NotoR';
    font-size: 32px;
    color: #fff;
    text-align: center;
  }

  .fix_motion {
    background-color: #232323;
    .fix_wrap {
      position: relative;
      .textBox {
        float: left;
        width: 50%;
        padding-top: 300px;
        p {
          max-width: 80%;
          font-size: 36px;
          font-family: 'NotoM';
          color: #333;
          transition: color 0.5s;
          text-align: center;
        }
        p.active {
          color: #fff;
        }
        p.txt02 {
          margin-top: 300px;
        }
        p.txt03 {
          margin-top: 300px;
        }
        p.txt04 {
          margin-top: 300px;
          margin-bottom: 500px;
        }
      }
      .imgFix {
        position: sticky;
        position: -webkit-sticky;
        top: calc(50vh - 350px);
        left: 0;
        z-index: 40;
        float: left;
        width: 50%;
        .officeImg {
          position: relative;
          width: 240px;
          height: 409px;
          margin: 0 auto;
          .imgOffice {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 20;
            opacity: 0;
            transform: translateY(-40px);
            transition: opacity 0.5s, transform 0.5s;
            .img {
              transition: transform 0.5s ease;
            }
          }
          .imgOffice2 {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            opacity: 0;
            transform: translateY(-40px);
            transition: opacity 0.5s, transform 0.5s;
            .img {
              transition: transform 0.5s ease;
            }
          }
        }
      }
      .active {
        .officeImg {
          .imgOffice {
            opacity: 1;
            transform: translateY(0px);
            transition-delay: 0.3s;
            .active {
              opacity: 0;
            }
          }
          .imgOffice2.active {
            opacity: 1;
          }
        }
      }
    }
    .fix_wrap:after {
      clear: both;
      display: block;
      content: '';
    }
  }
`;

const IntroPage = () => {
  const IntroImgRef = useRef<HTMLDivElement>(null);
  const fixMotionRef = useRef<HTMLDivElement>(null);
  const imgBoxRef = useRef<HTMLDivElement>(null);
  const officeImgRef = useRef<HTMLImageElement>(null);
  const officeImg2Ref = useRef<HTMLImageElement>(null);
  const txt01ref = useRef<HTMLDivElement>(null);
  const txt02ref = useRef<HTMLDivElement>(null);
  const txt03ref = useRef<HTMLDivElement>(null);
  const txt04ref = useRef<HTMLDivElement>(null);
  let scrollHeight: any;
  let winScrollTop: any;
  let sectionOffsetTop: any;
  let sectionScrollTop;
  let scrollRealHeight;
  let scrollPercent;
  let percent: any;

  let sectionMainTop: any;
  let sectionMainBottom: any;
  let sectionIsMoving = false;

  const setProperty = () => {
    if (fixMotionRef) {
      scrollHeight = fixMotionRef.current?.offsetHeight;
    }
    winScrollTop = window.pageYOffset;
    if (fixMotionRef.current?.getBoundingClientRect().top) {
      sectionOffsetTop =
        fixMotionRef.current?.getBoundingClientRect().top + winScrollTop;
    }
    sectionScrollTop = window.pageYOffset - sectionOffsetTop;
    scrollRealHeight = scrollHeight - window.innerHeight;
    scrollPercent = sectionScrollTop / scrollRealHeight;
    percent = scrollPercent * 100;

    if (IntroImgRef.current?.getBoundingClientRect().top) {
      sectionMainTop =
        IntroImgRef.current?.getBoundingClientRect().top + winScrollTop;
    }
    sectionMainBottom = sectionMainTop + IntroImgRef.current?.offsetHeight;
  };

  const moveSection = () => {
    if (winScrollTop > sectionMainTop && winScrollTop < sectionMainBottom) {
      if (!sectionIsMoving) {
        sectionIsMoving = true;
        moveStartRender();
      }
    }

    if (winScrollTop >= sectionMainTop) {
      activeCheck();
    }
  };

  const activeCheck = () => {
    // imgBoxRef.current?.classList.add('active');
  };

  const moveStartRender = () => {
    if (!IntroImgRef.current?.classList.contains('active')) {
      IntroImgRef.current?.classList.add('active');
      imgBoxRef.current?.classList.add('active');
      scrollMove(sectionMainBottom + 1);
    } else {
      IntroImgRef.current?.classList.remove('active');
      imgBoxRef.current?.classList.remove('active');
      scrollMove(sectionMainTop);
    }
  };

  const scrollMove = (moveY: any) => {
    const speed = 3;
    let vy = 0;
    let scrollY = 0;

    const loop = setInterval(() => {
      let dir = moveY > window.pageYOffset ? 1 : -1;
      vy += speed * dir;

      if (dir > 0) {
        scrollY = Math.min(moveY, window.pageYOffset + vy);
      } else {
        scrollY = Math.max(moveY, window.pageYOffset + vy);
      }

      window.scrollTo(0, scrollY);

      if (scrollY >= moveY && dir > 0) {
        sectionIsMoving = false;
        clearInterval(loop);
      } else if (scrollY <= moveY && dir < 0) {
        //업클리어
        sectionIsMoving = false;
        clearInterval(loop);
      }
    }, 10);
  };

  const contentIn = () => {
    if (percent >= 0 && percent < 31) {
      txt01ref.current?.classList.add('active');
      officeImgRef.current?.classList.remove('active');
      officeImg2Ref.current?.classList.remove('active');
    } else if (percent >= 31 && percent < 63) {
      txt02ref.current?.classList.add('active');
      officeImgRef.current?.classList.add('active');
      officeImg2Ref.current?.classList.add('active');
    } else if (percent >= 63 && percent < 88) {
      txt03ref.current?.classList.add('active');
    } else if (percent >= 88) {
      txt04ref.current?.classList.add('active');
    } else if (percent < 0) {
      txt01ref.current?.classList.remove('active');
      txt02ref.current?.classList.remove('active');
      txt03ref.current?.classList.remove('active');
      txt04ref.current?.classList.remove('active');
    }
  };

  const scrollFunc = () => {
    setProperty();
    contentIn();
    moveSection();
  };

  useEffect(() => {
    scrollFunc();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', scrollFunc);
    return () => {
      window.removeEventListener('scroll', scrollFunc);
    };
  }, []);

  return (
    <Wrapper>
      <div ref={IntroImgRef}>
        <img src="/img/Intro/Intro1.jpg" alt="Intro" className="introImg" />
      </div>
      <div ref={fixMotionRef} className="fix_motion">
        <article className="fix_wrap inner">
          <div className="textBox">
            <p ref={txt01ref}>오하민!</p>
            <p ref={txt02ref} className="txt02">
              서상균!
            </p>
            <p ref={txt03ref} className="txt03">
              박정현!
            </p>
            <p ref={txt04ref} className="txt04">
              홍성목!
            </p>
          </div>
          <div ref={imgBoxRef} className="imgFix">
            <div className="officeImg">
              <figure className="imgOffice">
                <img ref={officeImgRef} src="/img/MyOffice/level2.png" />
              </figure>
              <div ref={officeImg2Ref} className="imgOffice2">
                <figure>
                  <img src="/img/MyOffice/level3.png" />
                </figure>
                <div className="object_wrap">
                  <div className="object">
                    <figure>
                      <img src="" alt="" />
                    </figure>
                    <figure>
                      <img src="" alt="" />
                    </figure>
                    <figure>
                      <img src="" alt="" />
                    </figure>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="introBox"></div>
      <div className="introBox"></div>
    </Wrapper>
  );
};

export default IntroPage;