package com.ssafy.gaese.domain.algorithm.application;

import com.ssafy.gaese.domain.algorithm.dto.*;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRankDto;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRoomRedisDto;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoUserRedisDto;
import com.ssafy.gaese.domain.algorithm.entity.AlgoRecord;
import com.ssafy.gaese.domain.algorithm.repository.AlgoRankRedisRepository;
import com.ssafy.gaese.domain.algorithm.repository.AlgoRedisRepository;
import com.ssafy.gaese.domain.algorithm.repository.AlgoRedisRepositoryCustom;
import com.ssafy.gaese.domain.algorithm.repository.AlgoRepository;

import com.ssafy.gaese.domain.user.entity.User;
import com.ssafy.gaese.domain.user.exception.UserNotFoundException;
import com.ssafy.gaese.domain.user.repository.UserRepository;
import com.ssafy.gaese.global.redis.SocketInfo;
import lombok.RequiredArgsConstructor;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;

import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlgoService {

    @Value("${chrome-driver-path}")
    private String ChromePath;

    private final AlgoRepository algoRepository;
    private final UserRepository userRepository;
    private final AlgoRedisRepository algoRedisRepository;
    private final AlgoRedisRepositoryCustom algoRedisRepositoryCustom;
    private final AlgoRankRedisRepository algoRankRedisRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final SocketInfo socketInfo;
    private final SimpMessagingTemplate simpMessagingTemplate;


    public AlgoRecordDto createAlgoRecord(AlgoRecordReq algoRecordReq, Long userId){
        User user = userRepository.findById(userId).orElseThrow(()->new UserNotFoundException());
        Date date = new Date();
        AlgoRecordDto algoRecordDto;
        // roomCode, min, nickName, userId
        Optional<AlgoRankDto> opt = algoRankRedisRepository.findById(userId);
        if(opt.isPresent()){
            AlgoRankDto algoRankDto = opt.get();
            algoRecordDto = AlgoRecordDto.builder()
                    .isSolve(true)
                    .roomCode(algoRecordReq.getRoomCode())
                    .userId(userId)
                    .date(date)
                    .code(algoRecordReq.getCode())
                    .isRetry(false)
                    .problemId(algoRecordReq.getProblemId())
                    .ranking(algoRecordReq.getRanking())
                    .solveTime(algoRankDto.getMin())
                    .build();



        }else{
            algoRecordDto = AlgoRecordDto.builder()
                    .isSolve(false)
                    .roomCode(algoRecordReq.getRoomCode())
                    .userId(userId)
                    .date(date)
                    .code(algoRecordReq.getCode())
                    .isRetry(false)
                    .problemId(algoRecordReq.getProblemId())
                    .ranking(algoRecordReq.getRanking())
                    .solveTime("-")
                    .build();
        }


        algoRepository.save(algoRecordDto.toEntity(user));
        return algoRecordDto;
    }

    public Page<AlgoRecordDto> recordList(Pageable pageable, Long userId){
        User user = userRepository.findById(userId).orElseThrow(()->new UserNotFoundException());
        Page<AlgoRecord> algoRecords = algoRepository.findByUser(user, pageable);
        return algoRecords.map(algoRecord -> algoRecord.toDto());
    }

    public List<AlgoRoomDto> getRooms(){
        return algoRedisRepositoryCustom.getRooms();
    }

    public AlgoRoomDto createRoom(AlgoRoomDto algoRoomDto){
        String code = algoRedisRepositoryCustom.createCode();
        AlgoRoomRedisDto algoRoomRedisDto = algoRoomDto.toRedisDto(code);
        AlgoUserRedisDto algoUserRedisDto = new AlgoUserRedisDto(algoRoomDto.getMaster());
        algoRoomRedisDto.addUser(algoUserRedisDto);

        System.out.println(" =========== 사용자 확인 =========== ");
        System.out.println(algoRoomRedisDto.getUsers().toString());
        return algoRedisRepositoryCustom.createRoom(algoRoomDto.toRedisDto(code));
    }

    public boolean enterRoom(AlgoSocketDto algoSocketDto){

        HashOperations<String,String ,String> hashOperations = redisTemplate.opsForHash();
        String key = algoSocketDto.getRoomCode()+"-user";

        String userId = hashOperations.get(key,algoSocketDto.getSessionId());

        System.out.println("enterUser : " + userId);
        System.out.println("saved "+algoSocketDto.getUserId());
        if(userId != null && userId.equals(algoSocketDto.getUserId())){
            return false;
        }else{
            algoRedisRepositoryCustom.enterRoom(algoSocketDto);
            //session 정보 저장
            socketInfo.setSocketInfo(algoSocketDto.getSessionId(),
                    algoSocketDto.getUserId(),
                    algoSocketDto.getRoomCode(),
                    "Algo",
                    null);
            return true;
         }
    }

    public void leaveRoom(AlgoSocketDto algoSocketDto){
        System.out.println(algoSocketDto.getSessionId() + "나간다");
        HashOperations<String ,String, String > hashOperations = redisTemplate.opsForHash();
        ZSetOperations<String, String> zSetOperations = redisTemplate.opsForZSet();

        // 1. startTime 있는지 확인
        String startTime = hashOperations.get(algoSocketDto.getRoomCode(), "startTime");
        if(startTime != null ){
            System.out.println("시작함");
            //시작 후
            AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(algoSocketDto.getRoomCode()).orElseThrow(()->new NoSuchElementException());
            AlgoRankDto algoRankDto = AlgoRankDto.builder()
                    .min("--").nickName(userRepository.getNickNameById(Long.parseLong(algoSocketDto.getUserId()))).userId(Long.parseLong(algoSocketDto.getUserId())).build();
            zSetOperations.add(algoRankDto.getRoomCode()+"-rank", algoRankDto.getNickName(), algoRoomRedisDto.getAlgoRoomDto().getTime());
            algoRankRedisRepository.save(algoRankDto);
        }
        System.out.println("떠날꺼임");
        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(algoSocketDto.getRoomCode()).orElseThrow(()->new NoSuchElementException());

        algoRedisRepositoryCustom.leaveRoom(algoSocketDto);
        if(algoRoomRedisDto.getAlgoRoomDto().getMaster().equals(algoSocketDto.getUserId())){
            
            changeMaster(algoSocketDto.getRoomCode());
            System.out.println("마스터 변경");
        }


        HashMap<String, Object> res = new HashMap<>();
        res.put("msg",algoSocketDto.getUserId()+" 님이 나가셨습니다.");

        List<AlgoUserDto> users = getUsers(getUserIds(algoSocketDto.getRoomCode()));
        res.put("users",users);
        res.put("master", getMaster(algoSocketDto.getRoomCode()));
        simpMessagingTemplate.convertAndSend("/algo/room/"+algoSocketDto.getRoomCode(),res);


    }


    public String getMaster(String roomCode){
        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(roomCode).orElseThrow(()->new NoSuchElementException());
        return algoRoomRedisDto.getAlgoRoomDto().getMaster();
    }
    public void changeMaster(String roomCode){
        List<String> userIds = algoRedisRepositoryCustom.getUserInRoom(roomCode);
        if(userIds.size()==0) {
            deleteRoom(roomCode);
            return;
        }
        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(roomCode).orElseThrow(()->new NoSuchElementException());
        algoRoomRedisDto.getAlgoRoomDto().changeMaster(userIds.get(0));
        System.out.println(algoRoomRedisDto.toDto());
        algoRedisRepository.save(algoRoomRedisDto);
    }

    public void deleteRoom(String code){
        AlgoRoomRedisDto algoRoomRedisDto = algoRedisRepository.findById(code).orElseThrow(()->new NoSuchElementException());
        algoRedisRepositoryCustom.deleteRoom(algoRoomRedisDto);
    }

    public Boolean confirmRoomEnter(String roomCode){
        System.out.println(algoRedisRepositoryCustom.getRoomNum(roomCode));
        if(algoRedisRepositoryCustom.getRoomNum(roomCode) >= 4) return false;
        return true;
    }
    public List<String> getUserIds(String roomCode){
        return algoRedisRepositoryCustom.getUserInRoom(roomCode);
    }
    public List<AlgoUserDto> getUsers(List<String> userIds){
        return userRepository.findUsersByIds(userIds.stream().map(id->Long.parseLong(id)).collect(Collectors.toList())).stream().map(
                user -> user.toAlgoDto()).collect(Collectors.toList());
    }


    public String checkBjId(Long userId){
        Optional<String> opt = userRepository.getBjIdById(userId);
        if(opt.isPresent()){
            return opt.get();
        }
        return null;
    }

    public String createCode(Long userId){
        String code = algoRedisRepositoryCustom.createCode();
        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();
        hashOperations.put("bjCodes",userId+"",code);

        return code;
    }

    public Boolean confirmCode(Long userId){
        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();
        String code = hashOperations.get("bjCodes",userId+"");
        Boolean res = false;
        try{
            System.setProperty("webdriver.chrome.driver",ChromePath);
            ChromeOptions options = new ChromeOptions();
            options.addArguments("headless"); // 창 없이 크롤링
            WebDriver driver = new ChromeDriver(options);
            // 크롤링
            driver.get("https://www.acmicpc.net/user/"+userRepository.getBjIdById(userId).get());
            WebElement element = driver.findElement(By.className("no-mathjax"));
            String msg = element.getText();
            if(msg.contains(code)){
                res = true;
                hashOperations.delete("bjCodes", userId+"");
            }
        }catch (Exception e){
            /** 크롤링 에러처리 */
        }
        return res;
    }


}
