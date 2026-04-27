export default function InputTable({ splits, state, dispatch }) {
  if (splits.length === 0) {
    return <p>No splits to display</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Split</th>
          <th>Pace (MM:SS)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {splits.map(split => (
          <tr key={split.id} className={state.offendingIds.includes(split.id) ? 'offending' : ''}>
            <td>
              <div className="split-label">{split.label}</div>
            </td>
            <td>
              <input
                type="text"
                placeholder="MM:SS"
                inputMode="text"
                data-split-id={split.id}
                value={state.paceInputsById[split.id] || ''}
                onChange={e => dispatch({ type: 'SET_PACE_INPUT', payload: { splitId: split.id, value: e.target.value } })}
                onBlur={() => dispatch({ type: 'MARK_DIRTY', payload: true })}
              />
            </td>
            <td>
              <button
                type="button"
                onClick={() => dispatch({ type: 'CLEAR_PACE_INPUT', payload: { splitId: split.id } })}
              >
                Clear
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
