package priv.wzw.onw.statemachine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import priv.wzw.onw.*;
import priv.wzw.onw.dto.RoomDTO;
import priv.wzw.onw.event.RoomStateChangeEvent;

import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class GameTransitionConfig {

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(3);
    private final SimpMessagingTemplate template;
    private final JacksonUtils jacksonUtils;
    private final Converters converters;

    @Bean
    Transition<GameState, GameEvent, GameContext> initToStarted() {
        return new Transition<>(GameState.INIT, GameEvent.START, GameState.STARTED,
                acceptAndScheduleNext(GameEvent.START, 3));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> startedToWerewolfTurn() {
        return new Transition<>(GameState.STARTED, GameEvent.START, GameState.WEREWOLF_TURN,
                sendRoomStateAndAutoSkip(RoleCard.WEREWOLF));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> werewolfAct() {
        return new Transition<>(GameState.WEREWOLF_TURN, GameEvent.WEREWOLF_ACT, GameState.WEREWOLF_DONE,
                gameContext -> {
                    Integer index = gameContext.getWerewolfCenterCardIndex();
                    if (index == null || index >= Room.CENTER_SIZE || index < 0) {
                        return false;
                    }
                    List<RoleCard> playerCards = gameContext.getRoom().getPlayerCards();
                    long wolfCount = playerCards.stream().filter(RoleCard.WEREWOLF::equals).count();
                    return 1 == wolfCount;
                });
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> werewolfToMinionTurn() {
        return new Transition<>(EnumSet.of(GameState.WEREWOLF_TURN, GameState.WEREWOLF_DONE),
                GameEvent.TURN_END, GameState.MINION_TURN,
                sendRoomStateAndAutoSkip(RoleCard.MINION));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> minionAct() {
        return new Transition<>(GameState.MINION_TURN, GameEvent.MINION_ACT, GameState.MINION_DONE);
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> minionToSeerTurn() {
        return new Transition<>(EnumSet.of(GameState.MINION_TURN, GameState.MINION_DONE),
                GameEvent.TURN_END, GameState.SEER_TURN,
                sendRoomStateAndAutoSkip(RoleCard.SEER));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> seerAct() {
        return new Transition<>(GameState.SEER_TURN, GameEvent.SEER_ACT, GameState.SEER_DONE);
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> seerToRobberTurn() {
        return new Transition<>(EnumSet.of(GameState.SEER_TURN, GameState.SEER_DONE),
                GameEvent.TURN_END, GameState.ROBBER_TURN,
                sendRoomStateAndAutoSkip(RoleCard.ROBBER));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> robberAct() {
        return new Transition<>(GameState.ROBBER_TURN, GameEvent.ROBBER_ACT, GameState.ROBBER_DONE,
                gameContext -> {
                    int sourceIndex = gameContext.getRoom().getPlayerCards().indexOf(RoleCard.ROBBER);
                    int targetIndex = gameContext.getRobTargetIndex();
                    Collections.swap(gameContext.getRoom().getPlayerCards(), sourceIndex, targetIndex);
                });
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> robberToTroublemakerTurn() {
        return new Transition<>(EnumSet.of(GameState.ROBBER_TURN, GameState.ROBBER_DONE),
                GameEvent.TURN_END, GameState.TROUBLEMAKER_TURN,
                sendRoomStateAndAutoSkip(RoleCard.TROUBLEMAKER));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> troublemakerAct() {
        return new Transition<>(GameState.TROUBLEMAKER_TURN, GameEvent.TROUBLEMAKER_ACT, GameState.TROUBLEMAKER_DONE,
                gameContext -> {
                    List<RoleCard> roleCards = gameContext.getRoom().getPlayerCards();
                    int index1 = gameContext.getTroublemakerIndex1();
                    int index2 = gameContext.getTroublemakerIndex2();
                    Collections.swap(roleCards, index1, index2);
                });
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> troublemakerToDrunkTurn() {
        return new Transition<>(EnumSet.of(GameState.TROUBLEMAKER_TURN, GameState.TROUBLEMAKER_DONE),
                GameEvent.TURN_END, GameState.DRUNK_TURN,
                sendRoomStateAndAutoSkip(RoleCard.DRUNK));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> drunkAct() {
        return new Transition<>(GameState.DRUNK_TURN, GameEvent.DRUNK_ACT, GameState.DRUNK_DONE,
                gameContext -> {
                    List<RoleCard> centerCards = gameContext.getRoom().getCenterCards();
                    List<RoleCard> playerCards = gameContext.getRoom().getPlayerCards();
                    int centerIdx = gameContext.getDrunkCenterIndex();
                    RoleCard temp = centerCards.get(centerIdx);
                    int drunkIndex = playerCards.indexOf(RoleCard.DRUNK);
                    playerCards.set(drunkIndex, temp);
                    centerCards.set(centerIdx, RoleCard.DRUNK);
                });
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> drunkToInsomniacTurn() {
        return new Transition<>(EnumSet.of(GameState.DRUNK_TURN, GameState.DRUNK_DONE),
                GameEvent.TURN_END, GameState.INSOMNIAC_TURN,
                sendRoomStateAndAutoSkip(RoleCard.INSOMNIAC));
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> insomniacAct() {
        return new Transition<>(GameState.INSOMNIAC_TURN, GameEvent.INSOMNIAC_ACT, GameState.INSOMNIAC_DONE);
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> insomniacToVote() {
        return new Transition<>(EnumSet.of(GameState.INSOMNIAC_TURN, GameState.INSOMNIAC_DONE),
                GameEvent.TURN_END, GameState.VOTING,
                sendRoomStateEvent());
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> votingToEnd() {
        return new Transition<>(GameState.VOTING, GameEvent.VOTE_COMPLETE, GameState.END,
                gameContext -> {
                    Room room = gameContext.getRoom();
                    boolean anyVotes = room.getVotes().stream().anyMatch(v -> v.get() >= 0);
                    if (!anyVotes) {
                        log.info("no votes cast, reset vote counter");
                        room.getVotes().forEach(vote -> vote.set(-1));
                        return false;
                    }
                    return true;
                },
                sendRoomStateEvent());
    }

    @Bean
    Transition<GameState, GameEvent, GameContext> restart() {
        return new Transition<>(GameState.END, GameEvent.RESTART, GameState.INIT,
                gameContext -> {
                    Room room = gameContext.getRoom();
                    room.reset();
                    RoomStateChangeEvent event = new RoomStateChangeEvent(converters.toDTO(room));
                    template.convertAndSend("/topic/room/" + room.getId(),
                            jacksonUtils.toJson(event));
                });

    }


    private Consumer<GameContext> acceptAndScheduleNext(GameEvent nextEvent, int delaySeconds) {
        return gameContext -> {
            Room room = gameContext.getRoom();
            RoomDTO dto = converters.toDTO(room);
            log.info("Sending room state event: roomId={}, gamePhase={}, nextEvent={}, delay={}s",
                    room.getId(), dto.getGamePhase(), nextEvent, delaySeconds);
            RoomStateChangeEvent event = new RoomStateChangeEvent(dto);
            template.convertAndSend("/topic/room/" + room.getId(), jacksonUtils.toJson(event));
            GameStateMachine gameStateMachine = room.getGameStateMachine();
            scheduler.schedule(
                    () -> gameStateMachine.sendEvent(nextEvent, gameContext),
                    delaySeconds, TimeUnit.SECONDS);
        };
    }

    private Consumer<GameContext> sendRoomStateEvent() {
        return gameContext -> {
            Room room = gameContext.getRoom();
            RoomDTO dto = converters.toDTO(room);
            RoomStateChangeEvent event = new RoomStateChangeEvent(dto);
            template.convertAndSend("/topic/room/" + room.getId(), jacksonUtils.toJson(event));
        };
    }

    private Consumer<GameContext> sendRoomStateAndAutoSkip(RoleCard activeRole) {
        return gameContext -> {
            Room room = gameContext.getRoom();
            RoomDTO dto = converters.toDTO(room);
            RoomStateChangeEvent event = new RoomStateChangeEvent(dto);
            template.convertAndSend("/topic/room/" + room.getId(), jacksonUtils.toJson(event));
            if (!room.getPlayerCards().contains(activeRole)) {
                log.info("Auto-skipping turn for {} (not in player cards, in center pile)", activeRole);
                GameStateMachine gameStateMachine = room.getGameStateMachine();
                scheduler.schedule(
                        () -> gameStateMachine.sendEvent(GameEvent.TURN_END, gameContext),
                        500, TimeUnit.MILLISECONDS);
            }
        };
    }
}
