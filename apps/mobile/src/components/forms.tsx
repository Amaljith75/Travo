import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { formatDate, parseISODate, toISODate, todayISO } from '@travo/core';
import { colors, font, radius, spacing } from '../theme/tokens';
import { AppText, Button, IconButton, styles as ui } from './ui';

export function TextField({ label, error, icon, hint, style, multiline, ...rest }: TextInputProps & { label: string; error?: string; icon?: ReactNode; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="smallStrong" color={colors.ink} style={{ marginBottom: 6 }}>
        {label}
      </AppText>
      <View style={[s.field, multiline && { height: 96, alignItems: 'flex-start', paddingTop: 12 }, focused && s.fieldFocus, !!error && s.fieldError]}>
        {icon}
        <TextInput
          placeholderTextColor={colors.faint}
          multiline={multiline}
          accessibilityLabel={label}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }, style]}
        />
      </View>
      {error ? (
        <AppText variant="small" color={colors.danger} style={{ marginTop: 4 }} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color={colors.muted} style={{ marginTop: 4 }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Pressable field that looks like an input. */
export function PickerField({ label, value, placeholder, onPress, icon, error }: { label: string; value?: string | null; placeholder: string; onPress: () => void; icon?: ReactNode; error?: string }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="smallStrong" color={colors.ink} style={{ marginBottom: 6 }}>
        {label}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ?? placeholder}`} onPress={onPress} style={[s.field, !!error && s.fieldError]}>
        {icon}
        <AppText variant="body" color={value ? colors.charcoal : colors.faint} style={{ flex: 1 }} numberOfLines={1}>
          {value ?? placeholder}
        </AppText>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      {error && (
        <AppText variant="small" color={colors.danger} style={{ marginTop: 4 }}>
          {error}
        </AppText>
      )}
    </View>
  );
}

export function BottomSheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={s.grabber} />
        <View style={[ui.row, { justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.md }]}>
          <AppText variant="title">{title}</AppText>
          <IconButton label="Close" onPress={onClose}>
            <X size={18} color={colors.charcoal} />
          </IconButton>
        </View>
        <View style={{ flexShrink: 1 }}>{children}</View>
        {footer && <View style={s.sheetFooter}>{footer}</View>}
      </View>
    </Modal>
  );
}

export function SelectSheet<T extends string>({ visible, onClose, title, options, value, onSelect, allowClear }: { visible: boolean; onClose: () => void; title: string; options: { value: T; label: string; hint?: string }[]; value?: T | null; onSelect: (v: T | null) => void; allowClear?: boolean }) {
  const data = allowClear ? [{ value: '' as T, label: 'Any' }, ...options] : options;
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <FlatList
        data={data}
        keyExtractor={(o) => o.value || '__any'}
        style={{ maxHeight: 460 }}
        renderItem={({ item }) => {
          const selected = (value ?? '') === item.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onSelect(item.value === '' ? null : item.value);
                onClose();
              }}
              style={({ pressed }) => [s.option, pressed && { backgroundColor: colors.sandSoft }]}
            >
              <View style={{ flex: 1 }}>
                <AppText variant={selected ? 'bodyStrong' : 'body'}>{item.label}</AppText>
                {'hint' in item && item.hint && <AppText variant="small" color={colors.muted}>{item.hint}</AppText>}
              </View>
              {selected && <Check size={18} color={colors.emerald} />}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Pure-JS calendar so it behaves identically on Android, iOS and web. */
export function CalendarSheet({ visible, onClose, value, onSelect, minDate = todayISO(), allowedDates, title = 'Choose travel date' }: { visible: boolean; onClose: () => void; value?: string | null; onSelect: (d: string) => void; minDate?: string; allowedDates?: string[]; title?: string }) {
  const initial = parseISODate(value ?? allowedDates?.[0] ?? minDate);
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const allowed = useMemo(() => (allowedDates?.length ? new Set(allowedDates) : null), [allowedDates]);
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= days; d++) out.push(toISODate(new Date(cursor.y, cursor.m, d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);
  const move = (delta: number) => setCursor(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const minMonth = parseISODate(minDate);
  const atMin = cursor.y === minMonth.getFullYear() && cursor.m <= minMonth.getMonth();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={{ paddingHorizontal: spacing.xl }}>
        <View style={[ui.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <IconButton label="Previous month" onPress={() => !atMin && move(-1)} style={atMin && { opacity: 0.3 }}>
            <ChevronLeft size={18} color={colors.charcoal} />
          </IconButton>
          <AppText variant="heading">
            {MONTHS[cursor.m]} {cursor.y}
          </AppText>
          <IconButton label="Next month" onPress={() => move(1)}>
            <ChevronRight size={18} color={colors.charcoal} />
          </IconButton>
        </View>
        {allowed && (
          <AppText variant="small" color={colors.muted} style={{ marginBottom: spacing.sm }}>
            Only highlighted dates are available for this package.
          </AppText>
        )}
        <View style={s.grid}>
          {WEEK.map((w, i) => (
            <AppText key={`${w}${i}`} variant="caption" color={colors.muted} style={s.cellText}>
              {w}
            </AppText>
          ))}
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={s.cell} />;
            const disabled = d < minDate || (allowed ? !allowed.has(d) : false);
            const selected = d === value;
            return (
              <Pressable
                key={d}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={formatDate(d)}
                accessibilityState={{ disabled, selected }}
                onPress={() => {
                  onSelect(d);
                  onClose();
                }}
                style={s.cell}
              >
                <View style={[s.day, allowed && !disabled && s.dayAllowed, selected && s.daySelected]}>
                  <AppText variant={selected ? 'bodyStrong' : 'body'} color={selected ? colors.white : disabled ? colors.line : colors.charcoal}>
                    {parseISODate(d).getDate()}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

export function DateField({ label, value, onChange, error, allowedDates, minDate }: { label: string; value?: string | null; onChange: (d: string) => void; error?: string; allowedDates?: string[]; minDate?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PickerField label={label} value={value ? formatDate(value) : null} placeholder="Select a date" icon={<CalendarDays size={18} color={colors.emerald} />} onPress={() => setOpen(true)} error={error} />
      <CalendarSheet visible={open} onClose={() => setOpen(false)} value={value} onSelect={onChange} allowedDates={allowedDates} minDate={minDate} />
    </>
  );
}

export function FormSubmitBar({ label, onPress, loading, note }: { label: string; onPress: () => void; loading?: boolean; note?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.submitBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {note && (
        <AppText variant="small" color={colors.muted} style={{ marginBottom: spacing.sm, textAlign: 'center' }}>
          {note}
        </AppText>
      )}
      <Button label={label} size="lg" full onPress={onPress} loading={loading} />
    </View>
  );
}

const s = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: spacing.md },
  fieldFocus: { borderColor: colors.emerald },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, ...font.body, color: colors.charcoal, paddingVertical: 0, height: '100%' },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: '88%', paddingTop: spacing.sm },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: spacing.md },
  sheetFooter: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: spacing.lg },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellText: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: 6 },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayAllowed: { backgroundColor: colors.emeraldSoft },
  daySelected: { backgroundColor: colors.forest },
  submitBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
