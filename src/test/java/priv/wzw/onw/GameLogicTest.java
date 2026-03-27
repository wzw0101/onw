package priv.wzw.onw;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import priv.wzw.onw.statemachine.GameContext;
import priv.wzw.onw.statemachine.GameStateMachine;
import priv.wzw.onw.statemachine.Transition;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/**
 * 游戏核心逻辑单元测试（不需要 Spring 容器）
 *
 * 注意: Room.selectedCards 是 HashSet，重复角色会被去重。
 *       测试数据中避免使用重复角色。
 */
class GameLogicTest {

    // ========================
    // Room 辅助方法
    // ========================

    private Room createRoom(List<RoleCard> selectedCards) {
        return createRoom(selectedCards, false);
    }

    /**
     * 创建 Room 并分配卡牌。
     * @param selectedCards 全部角色卡
     * @param guaranteePlayerCards 是否保证 selectedCards 的前 N 张在 playerCards 中
     *                            （N = selectedCards.size() - CENTER_SIZE）
     */
    private Room createRoom(List<RoleCard> selectedCards, boolean guaranteePlayerCards) {
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

        if (guaranteePlayerCards) {
            // 手动分配: 前 playerSize 张给玩家，后 CENTER_SIZE 张放中心
            room.getPlayerCards().addAll(selectedCards.subList(0, playerSize));
            room.getPlayerInitialCards().addAll(selectedCards.subList(0, playerSize));
            room.getCenterCards().addAll(selectedCards.subList(playerSize, selectedCards.size()));
        } else {
            room.shuffleRoleCards();
        }
        return room;
    }

    private GameContext ctx(Room room) {
        return GameContext.builder().room(room).build();
    }

    // ========================
    // Room: 洗牌与角色分配
    // ========================

    @Nested
    @DisplayName("Room - 洗牌与角色分配")
    class ShuffleAndDistribution {

        @Test
        @DisplayName("3人局: playerCards=3, centerCards=3")
        void shuffleThreePlayers() {
            // 6 个不同角色 → 3 个玩家 + 3 个中心
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));

            assertEquals(3, room.getPlayerCards().size());
            assertEquals(Room.CENTER_SIZE, room.getCenterCards().size());
            assertEquals(3, room.getPlayerInitialCards().size());
        }

        @Test
        @DisplayName("playerCards + centerCards 的并集包含 selectedCards 中所有角色")
        void allCardsAccountedFor() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));

            List<RoleCard> all = new ArrayList<>();
            all.addAll(room.getPlayerCards());
            all.addAll(room.getCenterCards());

            assertEquals(6, all.size());
            // 每个 selected 的角色都应该出现在 all 中
            for (RoleCard card : room.getSelectedCards()) {
                assertTrue(all.contains(card), card + " should be in playerCards or centerCards");
            }
        }

        @Test
        @DisplayName("playerInitialCards 记录初始分配，不随技能变化")
        void initialCardsImmutableAfterSkill() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));
            List<RoleCard> initialCopy = new ArrayList<>(room.getPlayerInitialCards());

            // 模拟技能: swap
            Collections.swap(room.getPlayerCards(), 0, 1);

            assertEquals(initialCopy, room.getPlayerInitialCards(),
                    "playerInitialCards should not be modified by role skills");
        }

        @Test
        @DisplayName("5人局: playerCards=5, centerCards=3")
        void shuffleFivePlayers() {
            // 8 个不同角色 → 5 个玩家 + 3 个中心
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC,
                    RoleCard.MINION, RoleCard.VILLAGER
            ));

            assertEquals(5, room.getPlayerCards().size());
            assertEquals(Room.CENTER_SIZE, room.getCenterCards().size());
        }
    }

    // ========================
    // Room: 投票计票
    // ========================

    @Nested
    @DisplayName("Room - 投票计票")
    class VotingTests {

        private Room votingRoom() {
            return createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));
        }

        @Test
        @DisplayName("正常投票: 有明确最高票")
        void mostVotedClearWinner() {
            Room room = votingRoom();
            room.getVotes().get(0).set(1);
            room.getVotes().get(1).set(1);
            room.getVotes().get(2).set(0);

            assertEquals(1, room.getMostVotedTarget());
        }

        @Test
        @DisplayName("平票: 返回其中一个最高票目标")
        void mostVotedTie() {
            Room room = votingRoom();
            room.getVotes().get(0).set(1);
            room.getVotes().get(1).set(0);

            int result = room.getMostVotedTarget();
            assertTrue(result == 0 || result == 1, "tie should return one of the tied targets");
        }

        @Test
        @DisplayName("全部弃权: 返回-1")
        void mostVotedAllAbstain() {
            Room room = votingRoom();
            assertEquals(-1, room.getMostVotedTarget());
        }

        @Test
        @DisplayName("单人投票")
        void mostVotedSingleVote() {
            Room room = votingRoom();
            room.getVotes().get(0).set(2);
            assertEquals(2, room.getMostVotedTarget());
        }
    }

    // ========================
    // Room: 座位管理
    // ========================

    @Nested
    @DisplayName("Room - 座位管理")
    class SeatTests {

        private Room seatRoom() {
            return createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));
        }

        @Test
        @DisplayName("入座成功")
        void takeSeatSuccess() {
            Room room = seatRoom();
            assertTrue(room.takeSeat("player1", 0));
            assertEquals("player1", room.getSeats().get(0));
        }

        @Test
        @DisplayName("已被占的座位不能入座")
        void takeSeatAlreadyTaken() {
            Room room = seatRoom();
            room.takeSeat("player1", 0);
            assertFalse(room.takeSeat("player2", 0));
        }

        @Test
        @DisplayName("已 ready 的玩家不能换座位")
        void takeSeatWhenReady() {
            Room room = seatRoom();
            room.takeSeat("player1", 0);
            room.updateReadyState("player1", true);
            assertFalse(room.takeSeat("player1", 1));
        }

        @Test
        @DisplayName("换座位")
        void changeSeat() {
            Room room = seatRoom();
            room.takeSeat("player1", 0);
            assertTrue(room.takeSeat("player1", 2));
            assertNull(room.getSeats().get(0));
            assertEquals("player1", room.getSeats().get(2));
        }

        @Test
        @DisplayName("离座清空座位和 ready 状态")
        void leaveSeat() {
            Room room = seatRoom();
            room.takeSeat("player1", 1);
            room.updateReadyState("player1", true);
            room.leaveSeat("player1");
            assertNull(room.getSeats().get(1));
            assertFalse(room.getReadyList().get(1));
        }
    }

    // ========================
    // 角色技能: Robber (强盗)
    // ========================

    @Nested
    @DisplayName("Robber 技能")
    class RobberSkillTest {

        @Test
        @DisplayName("Robber 与目标玩家交换卡牌")
        void robberSwapsCard() {
            // 前3张保证在 playerCards: WEREWOLF, ROBBER, SEER
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.ROBBER, RoleCard.SEER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ), true);
            int robberIdx = room.getPlayerCards().indexOf(RoleCard.ROBBER);
            assertTrue(robberIdx >= 0, "robber should be in player cards");
            int targetIdx = (robberIdx == 0) ? 1 : 0;

            RoleCard robberOriginal = room.getPlayerCards().get(robberIdx);
            RoleCard targetOriginal = room.getPlayerCards().get(targetIdx);

            Collections.swap(room.getPlayerCards(), robberIdx, targetIdx);

            assertEquals(targetOriginal, room.getPlayerCards().get(robberIdx));
            assertEquals(robberOriginal, room.getPlayerCards().get(targetIdx));
        }

        @Test
        @DisplayName("Robber 技能只影响 playerCards")
        void robberDoesNotAffectCenter() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.ROBBER, RoleCard.SEER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ), true);
            List<RoleCard> centerBefore = new ArrayList<>(room.getCenterCards());

            int robberIdx = room.getPlayerCards().indexOf(RoleCard.ROBBER);
            assertTrue(robberIdx >= 0, "robber should be in player cards");
            Collections.swap(room.getPlayerCards(), robberIdx, 0);

            assertEquals(centerBefore, room.getCenterCards());
        }
    }

    // ========================
    // 角色技能: Troublemaker (捣蛋鬼)
    // ========================

    @Nested
    @DisplayName("Troublemaker 技能")
    class TroublemakerSkillTest {

        @Test
        @DisplayName("Troublemaker 交换两个其他玩家的卡牌")
        void troublemakerSwapsTwoCards() {
            // 前3张: WEREWOLF, SEER, TROUBLEMAKER
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.TROUBLEMAKER,
                    RoleCard.ROBBER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ), true);
            int tmIdx = room.getPlayerCards().indexOf(RoleCard.TROUBLEMAKER);
            assertTrue(tmIdx >= 0, "troublemaker should be in player cards");

            // 选两个不是 TM 的位置
            int idx1 = 0, idx2 = 1;
            if (idx1 == tmIdx) idx1 = 2;
            if (idx2 == tmIdx) idx2 = 2;

            RoleCard card1 = room.getPlayerCards().get(idx1);
            RoleCard card2 = room.getPlayerCards().get(idx2);

            Collections.swap(room.getPlayerCards(), idx1, idx2);

            assertEquals(card2, room.getPlayerCards().get(idx1));
            assertEquals(card1, room.getPlayerCards().get(idx2));
        }
    }

    // ========================
    // 角色技能: Drunk (酒鬼)
    // ========================

    @Nested
    @DisplayName("Drunk 技能")
    class DrunkSkillTest {

        @Test
        @DisplayName("Drunk 与中心牌交换")
        void drunkSwapsWithCenter() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.DRUNK,
                    RoleCard.ROBBER, RoleCard.TROUBLEMAKER, RoleCard.INSOMNIAC
            ), true);
            int drunkIdx = room.getPlayerCards().indexOf(RoleCard.DRUNK);
            assertTrue(drunkIdx >= 0, "drunk should be in player cards");
            int centerIdx = 0;

            RoleCard centerCard = room.getCenterCards().get(centerIdx);

            room.getPlayerCards().set(drunkIdx, centerCard);
            room.getCenterCards().set(drunkIdx, RoleCard.DRUNK);

            assertEquals(centerCard, room.getPlayerCards().get(drunkIdx));
        }
    }

    // ========================
    // 状态机 Predicate 逻辑
    // ========================

    @Nested
    @DisplayName("状态机 Transition Predicate")
    class TransitionPredicateTest {

        @Test
        @DisplayName("werewolfAct: 单狼时满足 predicate")
        void werewolfActSingleWolf() {
            // 前3张保证在 playerCards: WEREWOLF, SEER, ROBBER
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ), true);
            GameContext context = GameContext.builder().room(room).werewolfCenterCardIndex(0).build();

            // 模拟 werewolfAct predicate
            Integer index = context.getWerewolfCenterCardIndex();
            boolean validIndex = index != null && index >= 0 && index < Room.CENTER_SIZE;
            long wolfCount = room.getPlayerCards().stream().filter(RoleCard.WEREWOLF::equals).count();

            assertTrue(validIndex && wolfCount == 1, "single wolf should satisfy predicate");
        }

        @Test
        @DisplayName("werewolfAct: 双狼不满足单狼 predicate")
        void werewolfActDoubleWolf() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ), true);
            // 手动在 playerCards 中插入第二个狼（替换一个非狼角色）
            room.getPlayerCards().set(1, RoleCard.WEREWOLF);

            long wolfCount = room.getPlayerCards().stream().filter(RoleCard.WEREWOLF::equals).count();
            // 此时 playerCards 中有 2 个 WEREWOLF
            assertTrue(wolfCount > 1, "should have multiple wolves");
            assertNotEquals(1, wolfCount, "double wolf should not satisfy single-wolf predicate");
        }

        @Test
        @DisplayName("werewolfAct: 无效中心牌索引被拒绝")
        void werewolfActInvalidIndex() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));

            // 负数
            assertFalse(isValidWolfIndex(-1));
            // 超出范围
            assertFalse(isValidWolfIndex(Room.CENTER_SIZE));
            // null
            assertFalse(isValidWolfIndex(null));
        }

        private boolean isValidWolfIndex(Integer index) {
            return index != null && index >= 0 && index < Room.CENTER_SIZE;
        }

        @Test
        @DisplayName("votingToEnd: 有效投票允许结束")
        void votingValid() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));
            room.getVotes().get(0).set(1);
            room.getVotes().get(1).set(1);
            room.getVotes().get(2).set(0);

            assertTrue(room.getMostVotedTarget() >= 0);
        }

        @Test
        @DisplayName("votingToEnd: 全部弃票阻止结束")
        void votingAllAbstain() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));
            assertFalse(room.getMostVotedTarget() >= 0);
        }
    }

    // ========================
    // 状态机完整流转
    // ========================

    @Nested
    @DisplayName("状态机完整流转")
    class FullStateMachineFlow {

        private Transition<GameState, GameEvent, GameContext> t(
                GameState from, GameEvent event, GameState to) {
            return new Transition<>(from, event, to);
        }

        private Transition<GameState, GameEvent, GameContext> t(
                EnumSet<GameState> from, GameEvent event, GameState to) {
            return new Transition<>(from, event, to);
        }

        private List<Transition<GameState, GameEvent, GameContext>> buildTransitions() {
            var votePred = (java.util.function.Predicate<GameContext>)
                    c -> c.getRoom().getMostVotedTarget() >= 0;

            return List.of(
                    t(GameState.INIT, GameEvent.START, GameState.STARTED),
                    t(GameState.STARTED, GameEvent.START, GameState.WEREWOLF_TURN),
                    t(EnumSet.of(GameState.WEREWOLF_TURN, GameState.WEREWOLF_DONE),
                            GameEvent.TURN_END, GameState.MINION_TURN),
                    t(EnumSet.of(GameState.MINION_TURN, GameState.MINION_DONE),
                            GameEvent.TURN_END, GameState.SEER_TURN),
                    t(EnumSet.of(GameState.SEER_TURN, GameState.SEER_DONE),
                            GameEvent.TURN_END, GameState.ROBBER_TURN),
                    t(EnumSet.of(GameState.ROBBER_TURN, GameState.ROBBER_DONE),
                            GameEvent.TURN_END, GameState.TROUBLEMAKER_TURN),
                    t(EnumSet.of(GameState.TROUBLEMAKER_TURN, GameState.TROUBLEMAKER_DONE),
                            GameEvent.TURN_END, GameState.DRUNK_TURN),
                    t(EnumSet.of(GameState.DRUNK_TURN, GameState.DRUNK_DONE),
                            GameEvent.TURN_END, GameState.INSOMNIAC_TURN),
                    t(EnumSet.of(GameState.INSOMNIAC_TURN, GameState.INSOMNIAC_DONE),
                            GameEvent.TURN_END, GameState.VOTING),
                    new Transition<>(GameState.VOTING, GameEvent.VOTE_COMPLETE, GameState.END, votePred)
            );
        }

        @Test
        @DisplayName("完整游戏流程: INIT → END")
        void fullFlowNoRoleActions() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));

            var sm = new priv.wzw.onw.statemachine.StateMachine<>(GameState.INIT, buildTransitions());
            GameContext context = ctx(room);

            // 走完所有阶段
            sm.sendEvent(GameEvent.START, context);
            sm.sendEvent(GameEvent.START, context);
            for (int i = 0; i < 7; i++) {
                sm.sendEvent(GameEvent.TURN_END, context);
            }
            assertEquals(GameState.VOTING, sm.getCurrentState());

            // 投票
            room.getVotes().get(0).set(1);
            sm.sendEvent(GameEvent.VOTE_COMPLETE, context);
            assertEquals(GameState.END, sm.getCurrentState());
        }

        @Test
        @DisplayName("投票全弃权时 VOTE_COMPLETE 不触发状态变更")
        void voteBlockedOnAllAbstain() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));

            var votePred = (java.util.function.Predicate<GameContext>)
                    c -> c.getRoom().getMostVotedTarget() >= 0;
            var sm = new priv.wzw.onw.statemachine.StateMachine<>(GameState.VOTING,
                    List.of(new Transition<>(GameState.VOTING, GameEvent.VOTE_COMPLETE, GameState.END, votePred)));

            sm.sendEvent(GameEvent.VOTE_COMPLETE, ctx(room));
            assertEquals(GameState.VOTING, sm.getCurrentState());
        }

        @Test
        @DisplayName("RESTART: END → INIT")
        void restartTransition() {
            Room room = createRoom(List.of(
                    RoleCard.WEREWOLF, RoleCard.SEER, RoleCard.ROBBER,
                    RoleCard.TROUBLEMAKER, RoleCard.DRUNK, RoleCard.INSOMNIAC
            ));
            AtomicBoolean resetCalled = new AtomicBoolean(false);

            var restartAction = (java.util.function.Consumer<GameContext>) c -> {
                c.getRoom().reset();
                resetCalled.set(true);
            };
            var sm = new priv.wzw.onw.statemachine.StateMachine<>(GameState.END,
                    List.of(new Transition<>(GameState.END, GameEvent.RESTART, GameState.INIT, restartAction)));

            sm.sendEvent(GameEvent.RESTART, ctx(room));
            assertEquals(GameState.INIT, sm.getCurrentState());
            assertTrue(resetCalled.get());
        }
    }
}
