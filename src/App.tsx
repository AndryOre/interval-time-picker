import { useState } from 'react';
import './App.css';
import { IntervalTimePicker } from '@/components';

function App() {
	const [interval, setInterval] = useState({
		hours: 1,
		minutes: 30,
		seconds: 0,
	});
	const [selectedPreset, setSelectedPreset] = useState('1');

	const presets = [
		{
			id: '1',
			value: '1',
			label: '1 Hour',
			duration: { hours: 1, minutes: 0, seconds: 0 },
		},
		{
			id: '2',
			value: '2',
			label: '6 Hours',
			duration: { hours: 6, minutes: 0, seconds: 0 },
		},
		{
			id: '3',
			value: '3',
			label: '12 Hours',
			duration: { hours: 12, minutes: 0, seconds: 0 },
		},
		{
			id: '4',
			value: '4',
			label: '1 Day',
			duration: { hours: 24, minutes: 0, seconds: 0 },
		},
		{ id: 'custom', value: 'custom', label: 'Custom' },
	];

	return (
		<>
			<IntervalTimePicker
				interval={interval}
				setInterval={setInterval}
				presets={presets}
				selectedPreset={selectedPreset}
				onPresetChange={setSelectedPreset}
				minInterval={{ hours: 0, minutes: 5, seconds: 0 }}
				maxInterval={{ hours: 24, minutes: 0, seconds: 0 }}
			/>
		</>
	);
}

export default App;
