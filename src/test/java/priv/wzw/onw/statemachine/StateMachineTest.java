package priv.wzw.onw.statemachine;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;

class StateMachineTest {

    enum LightState { OFF, ON, BROKEN }
    enum LightEvent { TOGGLE, BREAK, FIX }

    @Test
    void initialStateIsSet() {
        var sm = new StateMachine<LightState, LightEvent, SimpleContext>(LightState.OFF, List.of());
        assertEquals(LightState.OFF, sm.getCurrentState());
    }

    @Test
    void transitionChangesState() {
        AtomicBoolean actionCalled = new AtomicBoolean(false);
        Consumer<SimpleContext> action = ctx -> actionCalled.set(true);
        var transition = new Transition<LightState, LightEvent, SimpleContext>(
                LightState.OFF, LightEvent.TOGGLE, LightState.ON, action
        );
        var sm = new StateMachine<>(LightState.OFF, List.of(transition));
        sm.sendEvent(LightEvent.TOGGLE, new SimpleContext());

        assertEquals(LightState.ON, sm.getCurrentState());
        assertTrue(actionCalled.get(), "transition action should be called");
    }

    @Test
    void unmatchedEventDoesNothing() {
        var transition = new Transition<LightState, LightEvent, SimpleContext>(
                LightState.OFF, LightEvent.TOGGLE, LightState.ON
        );
        var sm = new StateMachine<>(LightState.OFF, List.of(transition));
        sm.sendEvent(LightEvent.BREAK, new SimpleContext());

        assertEquals(LightState.OFF, sm.getCurrentState(), "state should not change for unmatched event");
    }

    @Test
    void predicateFalseBlocksTransition() {
        java.util.function.Predicate<SimpleContext> pred = ctx -> ctx.isTransitioned();
        var transition = new Transition<LightState, LightEvent, SimpleContext>(
                LightState.OFF, LightEvent.TOGGLE, LightState.ON, pred
        );
        var sm = new StateMachine<>(LightState.OFF, List.of(transition));
        sm.sendEvent(LightEvent.TOGGLE, new SimpleContext());

        assertEquals(LightState.OFF, sm.getCurrentState(), "transition should be blocked by predicate");
    }

    @Test
    void multipleTransitionsFirstMatchWins() {
        var t1 = new Transition<LightState, LightEvent, SimpleContext>(
                LightState.OFF, LightEvent.TOGGLE, LightState.ON
        );
        var t2 = new Transition<LightState, LightEvent, SimpleContext>(
                LightState.OFF, LightEvent.TOGGLE, LightState.BROKEN
        );
        var sm = new StateMachine<>(LightState.OFF, List.of(t1, t2));
        sm.sendEvent(LightEvent.TOGGLE, new SimpleContext());

        assertEquals(LightState.ON, sm.getCurrentState(), "first matching transition should win");
    }

    @Test
    void enumSetSourceMatchesAnyState() {
        var transition = new Transition<LightState, LightEvent, SimpleContext>(
                java.util.EnumSet.of(LightState.ON, LightState.BROKEN),
                LightEvent.FIX, LightState.OFF
        );
        var sm = new StateMachine<>(LightState.ON, List.of(transition));
        sm.sendEvent(LightEvent.FIX, new SimpleContext());
        assertEquals(LightState.OFF, sm.getCurrentState());

        // reset to BROKEN and try again
        sm = new StateMachine<>(LightState.BROKEN, List.of(transition));
        sm.sendEvent(LightEvent.FIX, new SimpleContext());
        assertEquals(LightState.OFF, sm.getCurrentState());
    }

    static class SimpleContext extends StateMachineContext {}
}
