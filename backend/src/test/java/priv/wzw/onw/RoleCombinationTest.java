package priv.wzw.onw;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import priv.wzw.onw.statemachine.GameContext;
import priv.wzw.onw.statemachine.GameStateMachine;
import priv.wzw.onw.statemachine.StateMachine;
import priv.wzw.onw.statemachine.Transition;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Predicate;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * 参数化测试: 验证不同角色组合下状态机都能完整流转
 *
 * 注意: Room.selectedCards 是 HashSet，重复角色会被去重。
 *       测试数据中使用不同角色。
 */
@DisplayName("角色组合参数化测试")
class RoleCombinationTest {

    // ========================
    // 角色组合数据源（全部用不同角色避免 Set 去重）
    // ========================

    static Stream<Arguments> threePlayerCombinations() {
        return Stream.of(
                Arguments.of("狼人/预言家/强盗",
                        List.of(RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                                RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC)),
                Arguments.of("狼人/捣蛋鬼/酒鬼",
                        List.of(RoleCard.WEREWOLF, RoleCard.TROUBLEMAKER, RoleCard.DRUNK,
                                RoleCard.SEER, RoleCard.ROBBER, RoleCard.INSOMNIAC)),
                Arguments.of("狼人/强盗/捣蛋鬼",
                        List.of(RoleCard.WEREWOLF, RoleCard.ROBBER, RoleCard.TROUBLEMAKER,
                                RoleCard.SEER, RoleCard.DRUNK, RoleCard.INSOMNIAC)),
                Arguments.of("爪牙/狼人/预言家",
                        List.of(RoleCard.MINION, RoleCard.WEREWOLF, RoleCard.SEER,
                                RoleCard.ROBBER, RoleCard.TROUBLEMAKER, RoleCard.DRUNK)),
                Arguments.of("酒鬼/失眠者/狼人",
                        List.of(RoleCard.DRUNK, RoleCard.INSOMNIAC, RoleCard.WEREWOLF,
                                RoleCard.SEER, RoleCard.ROBBER, RoleCard.TROUBLEMAKER)),
                Arguments.of("村民/预言家/强盗",
                        List.of(RoleCard.VILLAGER, RoleCard.SEER, RoleCard.ROBBER,
                                RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC))
        );
    }

    static Stream<Arguments> fivePlayerCombinations() {
        return Stream.of(
                Arguments.of("5人经典",
                        List.of(RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                                RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC,
                                RoleCard.MINION, RoleCard.VILLAGER))
        );
    }

    // ========================
    // Room 构建
    // ========================

    private Room createRoom(List<RoleCard> selectedCards) {
        RoomManager roomManager = mock(RoomManager.class);
        GameStateMachine gsm = mock(GameStateMachine.class);
        Player dummyHost = new Player();
        dummyHost.setUserId("host");

        Room room = new Room(gsm, dummyHost, roomManager);
        room.getSelectedCards().addAll(selectedCards);

        int playerSize = selectedCards.size() - Room.CENTER_SIZE;
        room.getSeats().addAll(Arrays.asList(new String[playerSize]));

        List<PlayerColor> colors = Arrays.asList(PlayerColor.values());
        Collections.shuffle(colors);
        room.getColorPool().addAll(colors.subList(0, playerSize));

        for (int i = 0; i < playerSize; i++) {
            room.getReadyList().add(false);
            room.getVotes().add(new AtomicInteger(-1));
        }

        room.shuffleRoleCards();
        return room;
    }

    // ========================
    // 状态机构建（无 WebSocket/scheduler）
    // ========================

    private List<Transition<GameState, GameEvent, GameContext>> buildTransitions() {
        // Robber: 只有当 robTargetIndex 非 null 时才执行 swap
        Consumer<GameContext> robberAction = ctx -> {
            Integer target = ctx.getRobTargetIndex();
            if (target != null) {
                int sourceIndex = ctx.getRoom().getPlayerCards().indexOf(RoleCard.ROBBER);
                Collections.swap(ctx.getRoom().getPlayerCards(), sourceIndex, target);
            }
        };

        // Troublemaker: 只有当两个 index 都非 null 时才执行 swap
        Consumer<GameContext> troublemakerAction = ctx -> {
            Integer i1 = ctx.getTroublemakerIndex1();
            Integer i2 = ctx.getTroublemakerIndex2();
            if (i1 != null && i2 != null) {
                Collections.swap(ctx.getRoom().getPlayerCards(), i1, i2);
            }
        };

        // Drunk: 只有当 drunkCenterIndex 非 null 时才执行 swap
        Consumer<GameContext> drunkAction = ctx -> {
            Integer ci = ctx.getDrunkCenterIndex();
            if (ci != null) {
                List<RoleCard> centerCards = ctx.getRoom().getCenterCards();
                List<RoleCard> playerCards = ctx.getRoom().getPlayerCards();
                int drunkIndex = playerCards.indexOf(RoleCard.DRUNK);
                RoleCard temp = centerCards.get(ci);
                playerCards.set(drunkIndex, temp);
                centerCards.set(drunkIndex, RoleCard.DRUNK);
            }
        };

        // Wolf: 只有单狼且索引有效时才执行
        Predicate<GameContext> wolfPred = ctx -> {
            Integer index = ctx.getWerewolfCenterCardIndex();
            if (index == null || index < 0 || index >= Room.CENTER_SIZE) return false;
            long wolfCount = ctx.getRoom().getPlayerCards().stream()
                    .filter(RoleCard.WEREWOLF::equals).count();
            return wolfCount == 1;
        };

        Predicate<GameContext> votePred = ctx -> ctx.getRoom().getMostVotedTarget() >= 0;
        Consumer<GameContext> restartAction = ctx -> ctx.getRoom().reset();

        return List.of(
                new Transition<>(GameState.INIT, GameEvent.START, GameState.STARTED),
                new Transition<>(GameState.STARTED, GameEvent.START, GameState.WEREWOLF_TURN),

                new Transition<>(GameState.WEREWOLF_TURN, GameEvent.WEREWOLF_ACT,
                        GameState.WEREWOLF_DONE, wolfPred),
                new Transition<>(EnumSet.of(GameState.WEREWOLF_TURN, GameState.WEREWOLF_DONE),
                        GameEvent.TURN_END, GameState.MINION_TURN),

                new Transition<>(GameState.MINION_TURN, GameEvent.MINION_ACT, GameState.MINION_DONE),
                new Transition<>(EnumSet.of(GameState.MINION_TURN, GameState.MINION_DONE),
                        GameEvent.TURN_END, GameState.SEER_TURN),

                new Transition<>(GameState.SEER_TURN, GameEvent.SEER_ACT, GameState.SEER_DONE),
                new Transition<>(EnumSet.of(GameState.SEER_TURN, GameState.SEER_DONE),
                        GameEvent.TURN_END, GameState.ROBBER_TURN),

                new Transition<>(GameState.ROBBER_TURN, GameEvent.ROBBER_ACT,
                        GameState.ROBBER_DONE, robberAction),
                new Transition<>(EnumSet.of(GameState.ROBBER_TURN, GameState.ROBBER_DONE),
                        GameEvent.TURN_END, GameState.TROUBLEMAKER_TURN),

                new Transition<>(GameState.TROUBLEMAKER_TURN, GameEvent.TROUBLEMAKER_ACT,
                        GameState.TROUBLEMAKER_DONE, troublemakerAction),
                new Transition<>(EnumSet.of(GameState.TROUBLEMAKER_TURN, GameState.TROUBLEMAKER_DONE),
                        GameEvent.TURN_END, GameState.DRUNK_TURN),

                new Transition<>(GameState.DRUNK_TURN, GameEvent.DRUNK_ACT,
                        GameState.DRUNK_DONE, drunkAction),
                new Transition<>(EnumSet.of(GameState.DRUNK_TURN, GameState.DRUNK_DONE),
                        GameEvent.TURN_END, GameState.INSOMNIAC_TURN),

                new Transition<>(GameState.INSOMNIAC_TURN, GameEvent.INSOMNIAC_ACT,
                        GameState.INSOMNIAC_DONE),
                new Transition<>(EnumSet.of(GameState.INSOMNIAC_TURN, GameState.INSOMNIAC_DONE),
                        GameEvent.TURN_END, GameState.VOTING),

                new Transition<>(GameState.VOTING, GameEvent.VOTE_COMPLETE, GameState.END, votePred),

                new Transition<>(GameState.END, GameEvent.RESTART, GameState.INIT, restartAction)
        );
    }

    // ========================
    // 走完所有阶段的辅助方法
    // ========================

    private void playThroughAllPhases(StateMachine<GameState, GameEvent, GameContext> sm,
                                       Room room, GameContext baseCtx) {
        GameContext ctx = baseCtx;

        // INIT → STARTED → WEREWOLF_TURN
        sm.sendEvent(GameEvent.START, ctx);
        sm.sendEvent(GameEvent.START, ctx);

        // WEREWOLF: 单狼查看中心牌
        if (room.getPlayerCards().contains(RoleCard.WEREWOLF)) {
            long wc = room.getPlayerCards().stream().filter(RoleCard.WEREWOLF::equals).count();
            if (wc == 1) {
                ctx = GameContext.builder().room(room).werewolfCenterCardIndex(0).build();
            }
        }
        sm.sendEvent(GameEvent.WEREWOLF_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);

        // MINION
        sm.sendEvent(GameEvent.MINION_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);

        // SEER
        sm.sendEvent(GameEvent.SEER_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);

        // ROBBER
        if (room.getPlayerCards().contains(RoleCard.ROBBER)) {
            int ri = room.getPlayerCards().indexOf(RoleCard.ROBBER);
            int target = (ri + 1) % room.getPlayerCards().size();
            ctx = GameContext.builder().room(room).robTargetIndex(target).build();
        }
        sm.sendEvent(GameEvent.ROBBER_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);

        // TROUBLEMAKER
        if (room.getPlayerCards().contains(RoleCard.TROUBLEMAKER)) {
            int tmi = room.getPlayerCards().indexOf(RoleCard.TROUBLEMAKER);
            int i1 = 0, i2 = 1;
            if (i1 == tmi) i1 = 2;
            if (i2 == tmi) i2 = 2;
            ctx = GameContext.builder().room(room).troublemakerIndex1(i1).troublemakerIndex2(i2).build();
        }
        sm.sendEvent(GameEvent.TROUBLEMAKER_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);

        // DRUNK
        if (room.getPlayerCards().contains(RoleCard.DRUNK)) {
            ctx = GameContext.builder().room(room).drunkCenterIndex(0).build();
        }
        sm.sendEvent(GameEvent.DRUNK_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);

        // INSOMNIAC
        sm.sendEvent(GameEvent.INSOMNIAC_ACT, ctx);
        sm.sendEvent(GameEvent.TURN_END, ctx);
    }

    // ========================
    // 测试
    // ========================

    @ParameterizedTest(name = "{0}")
    @MethodSource("threePlayerCombinations")
    @DisplayName("3人局 - 所有角色组合都能走完完整流程")
    void threePlayerFullFlow(String comboName, List<RoleCard> selectedCards) {
        Room room = createRoom(selectedCards);
        GameContext ctx = GameContext.builder().room(room).build();
        var sm = new StateMachine<>(GameState.INIT, buildTransitions());

        playThroughAllPhases(sm, room, ctx);

        assertEquals(GameState.VOTING, sm.getCurrentState(), comboName + ": should reach VOTING");

        // 投票
        room.getVotes().get(0).set(1);
        sm.sendEvent(GameEvent.VOTE_COMPLETE, GameContext.builder().room(room).build());
        assertEquals(GameState.END, sm.getCurrentState(), comboName + ": should reach END");

        // 验证卡牌总数不变
        List<RoleCard> allCards = new ArrayList<>();
        allCards.addAll(room.getPlayerCards());
        allCards.addAll(room.getCenterCards());
        assertEquals(room.getSelectedCards().size(), allCards.size(),
                comboName + ": card count should be preserved");
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("fivePlayerCombinations")
    @DisplayName("5人局 - 所有角色组合都能走完完整流程")
    void fivePlayerFullFlow(String comboName, List<RoleCard> selectedCards) {
        Room room = createRoom(selectedCards);
        GameContext ctx = GameContext.builder().room(room).build();
        var sm = new StateMachine<>(GameState.INIT, buildTransitions());

        playThroughAllPhases(sm, room, ctx);

        assertEquals(GameState.VOTING, sm.getCurrentState(), comboName + ": should reach VOTING");

        room.getVotes().get(0).set(1);
        sm.sendEvent(GameEvent.VOTE_COMPLETE, GameContext.builder().room(room).build());
        assertEquals(GameState.END, sm.getCurrentState(), comboName + ": should reach END");

        List<RoleCard> allCards = new ArrayList<>();
        allCards.addAll(room.getPlayerCards());
        allCards.addAll(room.getCenterCards());
        assertEquals(room.getSelectedCards().size(), allCards.size(),
                comboName + ": total card count");
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("threePlayerCombinations")
    @DisplayName("3人局 - RESTART 后可以重新开始")
    void restartAfterEnd(String comboName, List<RoleCard> selectedCards) {
        Room room = createRoom(selectedCards);
        GameContext ctx = GameContext.builder().room(room).build();
        var sm = new StateMachine<>(GameState.INIT, buildTransitions());

        playThroughAllPhases(sm, room, ctx);

        room.getVotes().get(0).set(1);
        sm.sendEvent(GameEvent.VOTE_COMPLETE, GameContext.builder().room(room).build());
        assertEquals(GameState.END, sm.getCurrentState());

        // RESTART
        sm.sendEvent(GameEvent.RESTART, GameContext.builder().room(room).build());
        assertEquals(GameState.INIT, sm.getCurrentState(), comboName + ": should restart to INIT");

        assertTrue(room.getReadyList().stream().allMatch(r -> !r), comboName + ": ready cleared");
        assertTrue(room.getVotes().stream().allMatch(v -> v.get() == -1), comboName + ": votes cleared");
    }
}
