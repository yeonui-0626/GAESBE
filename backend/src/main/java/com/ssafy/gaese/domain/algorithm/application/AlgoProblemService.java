package com.ssafy.gaese.domain.algorithm.application;


import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.querydsl.core.types.dsl.StringOperation;
import com.ssafy.gaese.domain.algorithm.dto.AlgoProblemDto;
import com.ssafy.gaese.domain.algorithm.dto.AlgoProblemReq;
import com.ssafy.gaese.domain.algorithm.dto.AlgoRoomDto;
import com.ssafy.gaese.domain.algorithm.dto.AlgoSolveReq;
import com.ssafy.gaese.domain.algorithm.dto.redis.AlgoRankDto;
import com.ssafy.gaese.domain.algorithm.repository.AlgoRankRedisRepository;
import com.ssafy.gaese.domain.user.repository.UserRepository;
import io.github.bonigarcia.wdm.WebDriverManager;
import lombok.RequiredArgsConstructor;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AlgoProblemService {

    private final RedisTemplate<String, String> redisTemplate;
    private final AlgoRankRedisRepository algoRankRedisRepository;
    private final UserRepository userRepository;
    ChromeDriver driver = null;

    public void getSolvedProblem(String roomCode, String userBjId){
        SetOperations<String, String> setOperations = redisTemplate.opsForSet();
        String key = roomCode+"-"+userBjId;
        List<String> problems = new LinkedList<>();

        // ????????? ??????
        try{
            WebDriverManager.chromedriver().setup();
            ChromeOptions chromeOptions = new ChromeOptions();
            chromeOptions.addArguments("--no-sandbox");
            chromeOptions.addArguments("--headless");
            chromeOptions.addArguments("disable-gpu");
            chromeOptions.addArguments("--disable-dev-shm-usage");
            driver = new ChromeDriver(chromeOptions);

            // ?????????
            System.out.println("======????????? ?????? ========");
            driver.get("https://www.acmicpc.net/user/"+userBjId);
            WebElement element = driver.findElement(By.className("problem-list"));
            problems = List.of(element.getText().split(" "));
            System.out.println("======????????? ??? ========");
            System.out.println(problems.toString());

        }catch (Exception e){

            System.out.println("????????? ??? ?????? ??????");
            System.out.println(e.toString());

        }finally {
            driver.quit();
        }

        if(problems.size()==0) return;
        //????????? ??????
        for(String problem : problems){
            setOperations.add(key,problem);
        }
        redisTemplate.expire(key,60*60*24, TimeUnit.SECONDS);
    }

    public List<AlgoProblemDto> getTierProblems(String tier) throws ExecutionException, InterruptedException, IOException {

        FirebaseApp firebaseApp = null;
        List<FirebaseApp> firebaseApps = FirebaseApp.getApps();

        if(firebaseApps != null && !firebaseApps.isEmpty()){

            for(FirebaseApp app : firebaseApps) {
                if (app.getName().equals(FirebaseApp.DEFAULT_APP_NAME)) {
                    firebaseApp = app;
                }
            }

        }else{

            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(GoogleCredentials.fromStream(new ClassPathResource("/firebaseKey.json").getInputStream()))
                    .setDatabaseUrl("https://ssafy-final-pjt-3addc-default-rtdb.firebaseio.com")
                    .build();
            firebaseApp = FirebaseApp.initializeApp(options);
        }


        Firestore db = FirestoreClient.getFirestore();
        List<AlgoProblemDto> list = new ArrayList<>();
        Query query =
                db.collection(tier).orderBy("submit", Query.Direction.DESCENDING);
        QuerySnapshot querySnapshot = query.get().get();
        int len = querySnapshot.size();
        len  = len < 50 ? len : 50;
        for (int i = 0; i < len; i++) {
            DocumentSnapshot documentSnapshot = querySnapshot.getDocuments().get(i);
            if (documentSnapshot.exists()) {
                Map<String, Object> map = documentSnapshot.getData();
                AlgoProblemDto algoProblemDto = new AlgoProblemDto(map.get("problemId").toString(), Integer.parseInt(map.get("correct").toString())
                        , map.get("ratio").toString(), Integer.parseInt(map.get("submit").toString()), map.get("tag").toString(), map.get("title").toString());

                list.add(algoProblemDto);
            }
        }
        return list;
    }

    public List<AlgoProblemDto> getCommonProblems(AlgoProblemReq algoProblemReq) throws ExecutionException, InterruptedException, IOException {
        SetOperations<String, String> setOperations = redisTemplate.opsForSet();
        List<AlgoProblemDto> algoProblemDtoList = getTierProblems(algoProblemReq.getTier()); // ?????? ?????? ??????
        Set<String> problemsSet = new HashSet<>();

        for(String user : algoProblemReq.getUsers()){
            String key = algoProblemReq.getRoomCode()+"-"+user;
            if(redisTemplate.hasKey(key)){ // ????????? ????????? ????????? ??????
                problemsSet.addAll(setOperations.members(key));
            }
        }

        // ??? ????????? ??????
//        for (int i = algoProblemDtoList.size() - 1; i >= 0; i--) {
//            if (problemsSet.contains(algoProblemDtoList.get(i).getProblemId()))
//                algoProblemDtoList.remove(algoProblemDtoList.get(i));
//        }
        System.out.println("=====> ?????? ?????? ??? : " + algoProblemDtoList.size());

        // list ?????? ??? ??? 10??? ????????????
//        Collections.shuffle(algoProblemDtoList);
       return algoProblemDtoList.subList(0, 10);
    }

    public int confirmSolve(AlgoSolveReq algoSolveReq){

        try{
            WebDriverManager.chromedriver().setup();
            ChromeOptions chromeOptions = new ChromeOptions();
            chromeOptions.addArguments("--no-sandbox");
            chromeOptions.addArguments("--headless");
            chromeOptions.addArguments("disable-gpu");
            chromeOptions.addArguments("--disable-dev-shm-usage");
            driver = new ChromeDriver(chromeOptions);
            // ?????????
            driver.get("https://www.acmicpc.net/status?problem_id="+algoSolveReq.getProblemId()
                    +"&user_id="+algoSolveReq.getUserBjId()
                    +"&language_id="+algoSolveReq.getLanId());
            WebElement element = driver.findElement(By.className("result-text"));
            String result = element.getText();
            System.out.println(" ????????? ?????? > "+ result);
            return  result.equals("???????????????!!")? 1 : 0; //

        }catch (Exception e){
            System.out.println("????????? ??? ?????? ??????");
            System.out.println(e.toString());
        }finally {
            driver.quit();
        }
        return 0;
    }

    public void saveTime(String roomCode){

        // ?????? ?????? ??????
        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();
        LocalTime now = LocalTime.now();
        DateTimeFormatter formatter =  DateTimeFormatter.ofPattern("HH:mm:ss");
        System.out.println("==== ?????? ====="+now.format(formatter));
        hashOperations.put(roomCode,"startTime",now.format(formatter));
        System.out.println(hashOperations.get(roomCode,"startTime"));

    }

    public void setStartGame(String roomCode){
        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();

        // ?????? ????????? ??????
        hashOperations.put("algoRoom:"+roomCode,"algoRoomDto.isStart","1");
    }

    public void saveUserTime(Long problemId,String roomCode, Long userId) throws ParseException {

        HashOperations<String, String,String> hashOperations = redisTemplate.opsForHash();
        ZSetOperations<String, String> zSetOperations = redisTemplate.opsForZSet();

        String start = hashOperations.get(roomCode, "startTime");
        if(start == null ){
            System.out.println("start time??? ?????? ??? ????????????.");
            throw new NullPointerException();
        }
        Date startTime = new SimpleDateFormat("HH:mm:ss").parse(LocalTime.now().toString());
        Date finTime = new SimpleDateFormat("HH:mm:ss").parse(hashOperations.get(roomCode, "startTime"));
        System.out.println(startTime);
        System.out.println(finTime);
        double minDiff = (startTime.getTime() - finTime.getTime()) / 60000.0; // ??? ??????
        System.out.println(minDiff+"???");

        AlgoRankDto algoRankDto = AlgoRankDto.builder()
                .problemId(problemId)
                .min((int)minDiff+"")
                .nickname(userRepository.getNickNameById(userId)+"")
                .userId(userId).build();
        //redis ?????? - ?????????
        zSetOperations.add(roomCode+"-rank", algoRankDto.getNickname(), minDiff);

        //redis ?????? - ?????????
        algoRankRedisRepository.save(algoRankDto);

    }


}
