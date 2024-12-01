import * as React from 'react';
import { RadioGroup, RadioGroupItem, Input } from '@/components';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const durationSchema = z.object({
	hours: z.number().min(0),
	minutes: z.number().min(0).max(59),
	seconds: z.number().min(0).max(59),
});

type Duration = z.infer<typeof durationSchema>;

interface IntervalPreset {
	id: string;
	value: string;
	label: string;
	duration?: Duration;
}

interface IntervalTimePickerProps {
	interval: Duration;
	setInterval: (interval: Duration) => void;
	minInterval?: Duration;
	maxInterval?: Duration;
	className?: string;
	showHours?: boolean;
	showMinutes?: boolean;
	showSeconds?: boolean;
	presets?: IntervalPreset[];
	selectedPreset?: string;
	onPresetChange?: (value: string) => void;
}

const DEFAULT_MIN_INTERVAL: Duration = {
	hours: 0,
	minutes: 0,
	seconds: 0,
};

const DEFAULT_MAX_INTERVAL: Duration = {
	hours: 999999,
	minutes: 59,
	seconds: 59,
};

function durationToMs(duration: Duration): number {
	return (
		duration.hours * 3600000 +
		duration.minutes * 60000 +
		duration.seconds * 1000
	);
}

function getNextValidDuration(
	duration: Duration,
	minInterval: Duration,
	maxInterval: Duration
): Duration {
	const durationMs = durationToMs(duration);
	const minIntervalMs = durationToMs(minInterval);
	const maxIntervalMs = durationToMs(maxInterval);

	if (durationMs < minIntervalMs) return minInterval;
	if (durationMs > maxIntervalMs) return maxInterval;
	return duration;
}

function getMaxValueForField(
	field: keyof Duration,
	currentDuration: Duration,
	maxInterval: Duration
): number {
	if (field === 'hours') return maxInterval.hours;

	if (currentDuration.hours === maxInterval.hours) {
		if (field === 'minutes') return maxInterval.minutes;
		if (
			field === 'seconds' &&
			currentDuration.minutes === maxInterval.minutes
		) {
			return maxInterval.seconds;
		}
	}

	return 59;
}

function getMinValueForField(
	field: keyof Duration,
	currentDuration: Duration,
	minInterval: Duration
): number {
	if (field === 'hours') return minInterval.hours;

	if (currentDuration.hours === minInterval.hours) {
		if (field === 'minutes') return minInterval.minutes;
		if (
			field === 'seconds' &&
			currentDuration.minutes === minInterval.minutes
		) {
			return minInterval.seconds;
		}
	}

	return 0;
}

function formatNumber(value: number): string {
	return value.toString().padStart(2, '0');
}

interface IntervalInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		'value' | 'onChange'
	> {
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	label: string;
	onLeftFocus?: () => void;
	onRightFocus?: () => void;
	isLastField?: boolean;
}

const IntervalInput = React.memo(
	React.forwardRef<HTMLInputElement, IntervalInputProps>(
		(
			{
				value,
				onChange,
				min,
				max,
				label,
				onLeftFocus,
				onRightFocus,
				isLastField = false,
				className,
				...props
			},
			ref
		) => {
			const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
				if (e.key === 'Tab') return;

				if (e.key === 'ArrowLeft' && onLeftFocus) {
					e.preventDefault();
					onLeftFocus();
				}

				if (e.key === 'ArrowRight' && onRightFocus && !isLastField) {
					e.preventDefault();
					onRightFocus();
				}

				if (e.key === 'ArrowUp') {
					e.preventDefault();
					const newValue = value + 1;
					onChange(newValue > max ? min : newValue);
				}

				if (e.key === 'ArrowDown') {
					e.preventDefault();
					const newValue = value - 1;
					onChange(newValue < min ? max : newValue);
				}

				if (/^\d$/.test(e.key)) {
					e.preventDefault();
					const currentStr = value.toString().padStart(2, '0');
					const newStr = currentStr.slice(1) + e.key;
					const newValue = parseInt(newStr, 10);

					if (newValue >= min && newValue <= max) {
						onChange(newValue);
						if (onRightFocus && !isLastField) onRightFocus();
					} else if (parseInt(e.key, 10) >= min && parseInt(e.key, 10) <= max) {
						onChange(parseInt(e.key, 10));
					}
				}
			};

			return (
				<div className="flex">
					<Input
						ref={ref}
						type="text"
						inputMode="numeric"
						value={formatNumber(value)}
						onChange={(e) => {
							const val = parseInt(e.target.value, 10);
							if (!isNaN(val) && val >= min && val <= max) {
								onChange(val);
							}
						}}
						onKeyDown={handleKeyDown}
						aria-label={`${label} input`}
						className={cn(
							'w-[48px] text-center tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none',
							'text-right -me-px rounded-e-none transition-all duration-200',
							className
						)}
						{...props}
					/>
					<span className="inline-flex h-10 items-center rounded-e-md border border-input bg-background px-3 text-sm text-muted-foreground">
						{label}
					</span>
				</div>
			);
		}
	)
);
IntervalInput.displayName = 'IntervalInput';

export const IntervalTimePicker = React.memo(
	React.forwardRef<HTMLDivElement, IntervalTimePickerProps>(
		(
			{
				interval,
				setInterval,
				minInterval = DEFAULT_MIN_INTERVAL,
				maxInterval = DEFAULT_MAX_INTERVAL,
				className,
				showHours = true,
				showMinutes = true,
				showSeconds = true,
				presets = [],
				selectedPreset,
				onPresetChange,
			},
			ref
		) => {
			const hoursRef = React.useRef<HTMLInputElement>(null);
			const minutesRef = React.useRef<HTMLInputElement>(null);
			const secondsRef = React.useRef<HTMLInputElement>(null);

			const isCustomMode = selectedPreset === 'custom';
			const showCustomFields = isCustomMode || presets.length === 0;

			const handleIntervalChange = React.useCallback(
				(newInterval: Duration) => {
					const adjustedInterval = {
						hours: showHours ? newInterval.hours : 0,
						minutes: showMinutes ? newInterval.minutes : 0,
						seconds: showSeconds ? newInterval.seconds : 0,
					};

					try {
						durationSchema.parse(adjustedInterval);

						const validInterval = getNextValidDuration(
							adjustedInterval,
							minInterval,
							maxInterval
						);
						setInterval(validInterval);
					} catch (error) {
						if (error instanceof z.ZodError) {
							console.error('Invalid duration:', error.errors);
						}
						setInterval(interval);
					}
				},
				[
					showHours,
					showMinutes,
					showSeconds,
					minInterval,
					maxInterval,
					setInterval,
					interval,
				]
			);

			const handlePresetChange = React.useCallback(
				(value: string) => {
					const preset = presets.find((p) => p.value === value);
					if (preset?.duration) {
						handleIntervalChange(preset.duration);
					}
					onPresetChange?.(value);
				},
				[presets, handleIntervalChange, onPresetChange]
			);

			const setHours = React.useCallback(
				(hours: number) => handleIntervalChange({ ...interval, hours }),
				[interval, handleIntervalChange]
			);

			const setMinutes = React.useCallback(
				(minutes: number) => handleIntervalChange({ ...interval, minutes }),
				[interval, handleIntervalChange]
			);

			const setSeconds = React.useCallback(
				(seconds: number) => handleIntervalChange({ ...interval, seconds }),
				[interval, handleIntervalChange]
			);

			const lastField = showSeconds
				? 'seconds'
				: showMinutes
				? 'minutes'
				: 'hours';

			return (
				<div
					ref={ref}
					className={cn('space-y-1', className)}
					role="group"
					aria-label="Time interval picker">
					{presets.length > 0 && (
						<RadioGroup
							value={selectedPreset}
							onValueChange={handlePresetChange}
							className="flex flex-wrap gap-2">
							{presets.map((item) => (
								<label
									key={item.id}
									className="relative flex cursor-pointer flex-col w-fit items-center gap-3 rounded-lg border border-input px-2 py-3 text-center shadow-sm shadow-black/5 ring-offset-background transition-colors has-[[data-disabled]]:cursor-not-allowed has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[[data-disabled]]:opacity-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/70 has-[:focus-visible]:ring-offset-2">
									<RadioGroupItem
										value={item.value}
										className="sr-only after:absolute after:inset-0"
									/>
									<p className="text-sm font-medium leading-none text-foreground">
										{item.label}
									</p>
								</label>
							))}
						</RadioGroup>
					)}

					{showCustomFields && (
						<div
							data-state={showCustomFields ? 'open' : 'closed'}
							className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
							<div className="flex items-end gap-2 pt-2">
								{showHours && (
									<IntervalInput
										ref={hoursRef}
										value={interval.hours}
										onChange={setHours}
										min={getMinValueForField('hours', interval, minInterval)}
										max={getMaxValueForField('hours', interval, maxInterval)}
										label="Hours"
										onRightFocus={() =>
											showMinutes && minutesRef.current?.focus()
										}
										isLastField={lastField === 'hours'}
									/>
								)}
								{showMinutes && (
									<IntervalInput
										ref={minutesRef}
										value={interval.minutes}
										onChange={setMinutes}
										min={getMinValueForField('minutes', interval, minInterval)}
										max={getMaxValueForField('minutes', interval, maxInterval)}
										label="Min"
										onLeftFocus={() => showHours && hoursRef.current?.focus()}
										onRightFocus={() =>
											showSeconds && secondsRef.current?.focus()
										}
										isLastField={lastField === 'minutes'}
									/>
								)}
								{showSeconds && (
									<IntervalInput
										ref={secondsRef}
										value={interval.seconds}
										onChange={setSeconds}
										min={getMinValueForField('seconds', interval, minInterval)}
										max={getMaxValueForField('seconds', interval, maxInterval)}
										label="Sec"
										onLeftFocus={() =>
											showMinutes && minutesRef.current?.focus()
										}
										isLastField={true}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			);
		}
	)
);
IntervalTimePicker.displayName = 'IntervalTimePicker';

export type { Duration, IntervalPreset, IntervalTimePickerProps };
