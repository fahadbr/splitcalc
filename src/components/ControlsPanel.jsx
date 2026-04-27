export default function ControlsPanel({ state, dispatch }) {
  return (
    <>
      <div className="controls-group">
        <div className="control">
          <label htmlFor="distance-preset">Distance</label>
          <select
            id="distance-preset"
            value={state.distancePresetKey}
            onChange={e => dispatch({ type: 'SET_DISTANCE_PRESET', payload: e.target.value })}
          >
            <option value="5K">5K</option>
            <option value="10K">10K</option>
            <option value="Half">Half Marathon</option>
            <option value="Full">Full Marathon</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="control">
          <label htmlFor="custom-distance">Custom Distance</label>
          <input
            type="number"
            id="custom-distance"
            min="0.1"
            step="0.1"
            inputMode="decimal"
            disabled={state.distancePresetKey !== 'Custom'}
            value={state.customDistanceValue ?? ''}
            onChange={e => {
              const value = parseFloat(e.target.value);
              dispatch({ type: 'SET_CUSTOM_DISTANCE', payload: isNaN(value) ? null : value });
            }}
          />
        </div>

        <div className="control">
          <label htmlFor="unit">Unit</label>
          <select
            id="unit"
            value={state.unit}
            onChange={e => dispatch({ type: 'SET_UNIT', payload: e.target.value })}
          >
            <option value="km">Kilometers (km)</option>
            <option value="mi">Miles (mi)</option>
          </select>
        </div>
      </div>

      <div className="controls-group">
        <div className="control">
          <label htmlFor="goal-hours">Goal Time - Hours</label>
          <input
            type="number"
            id="goal-hours"
            min="0"
            step="1"
            inputMode="numeric"
            value={state.goalTime.h}
            onChange={e => dispatch({ type: 'SET_GOAL_TIME_FIELD', payload: { field: 'h', value: e.target.value } })}
            onBlur={() => dispatch({ type: 'MARK_DIRTY', payload: true })}
          />
        </div>

        <div className="control">
          <label htmlFor="goal-minutes">Goal Time - Minutes</label>
          <input
            type="number"
            id="goal-minutes"
            min="0"
            max="59"
            step="1"
            inputMode="numeric"
            value={state.goalTime.m}
            onChange={e => dispatch({ type: 'SET_GOAL_TIME_FIELD', payload: { field: 'm', value: e.target.value } })}
            onBlur={() => dispatch({ type: 'MARK_DIRTY', payload: true })}
          />
        </div>

        <div className="control">
          <label htmlFor="goal-seconds">Goal Time - Seconds</label>
          <input
            type="number"
            id="goal-seconds"
            min="0"
            max="59"
            step="1"
            inputMode="numeric"
            value={state.goalTime.s}
            onChange={e => dispatch({ type: 'SET_GOAL_TIME_FIELD', payload: { field: 's', value: e.target.value } })}
            onBlur={() => dispatch({ type: 'MARK_DIRTY', payload: true })}
          />
        </div>
      </div>

      <div className="controls-group">
        <div className="control">
          <label htmlFor="strategy">Strategy</label>
          <select
            id="strategy"
            value={state.strategyKey}
            onChange={e => dispatch({ type: 'SET_STRATEGY', payload: e.target.value })}
          >
            <option value="even">Even pace</option>
            <option value="linear-negative">Linear negative split</option>
            <option value="linear-positive">Linear positive split</option>
            <option value="weighted">Weighted exponential</option>
          </select>
        </div>
      </div>
    </>
  );
}
