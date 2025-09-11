import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type StorageKind = 'local' | 'session' | 'none';

type UsePersistedParamOptions<T> = {
	pageKey: string;
	urlKey?: string;
	storage?: StorageKind;
	serialize?: (value: T) => string | null;
	deserialize?: (value: string) => T | null;
	shouldPersist?: (value: T) => boolean;
	replaceHistory?: boolean;
};

function getStorage(kind: StorageKind | undefined) {
	if (kind === 'session') return typeof window !== 'undefined' ? window.sessionStorage : undefined;
	if (kind === 'local' || kind === undefined) return typeof window !== 'undefined' ? window.localStorage : undefined;
	return undefined;
}

function defaultSerialize<T>(value: T): string | null {
	try {
		if (value === undefined || value === null) return null;
		if (Array.isArray(value)) return value.length ? value.join(',') : null;
		if (typeof value === 'string') return value.trim().length ? value : null;
		return JSON.stringify(value);
	} catch {
		return null;
	}
}

function defaultDeserialize<T>(raw: string): T | null {
	try {
		return (raw as unknown) as T;
	} catch {
		return null;
	}
}

export function usePersistedParam<T>(paramKey: string, initialValue: T, options: UsePersistedParamOptions<T>) {
	const { pageKey, urlKey, storage: storageKind, serialize, deserialize, shouldPersist, replaceHistory } = options;
	const [searchParams, setSearchParams] = useSearchParams();
	const storage = getStorage(storageKind);
	const storageKey = useMemo(() => `${pageKey}:${paramKey}`, [pageKey, paramKey]);
	const serializer = serialize ?? defaultSerialize<T>;
	const deserializer = deserialize ?? defaultDeserialize<T>;
	const urlParamKey = urlKey ?? paramKey;
	const hasInitializedRef = useRef(false);

	const [value, setValue] = useState<T>(() => {
		// Initialize from URL first
		const fromUrl = searchParams.get(urlParamKey);
		if (fromUrl !== null) {
			const parsed = deserializer(fromUrl);
			if (parsed !== null) return parsed;
		}
		// Then from storage
		try {
			const raw = storage?.getItem(storageKey);
			if (raw) {
				return JSON.parse(raw) as T;
			}
		} catch {}
		// Fallback
		return initialValue;
	});

	// One-time sync from URL/storage on mount (if URL changes before mount)
	useEffect(() => {
		if (hasInitializedRef.current) return;
		hasInitializedRef.current = true;
		const fromUrl = searchParams.get(urlParamKey);
		if (fromUrl !== null) {
			const parsed = deserializer(fromUrl);
			if (parsed !== null) {
				setValue(parsed);
				return;
			}
		}
		try {
			const raw = storage?.getItem(storageKey);
			if (raw) setValue(JSON.parse(raw) as T);
		} catch {}
		// else keep initial
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update URL + storage when value changes
	useEffect(() => {
		const urlString = serializer(value);
		const next = new URLSearchParams(searchParams);
		if (urlString === null || (shouldPersist && !shouldPersist(value))) {
			next.delete(urlParamKey);
		} else {
			next.set(urlParamKey, urlString);
		}
		setSearchParams(next, { replace: !!replaceHistory });
		try {
			if (storage) {
				if (urlString === null || (shouldPersist && !shouldPersist(value))) {
					storage.removeItem(storageKey);
				} else {
					storage.setItem(storageKey, JSON.stringify(value));
				}
			}
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	const update = useCallback((next: T) => {
		setValue(next);
	}, []);

	return [value, update] as const;
}

// Helpers for common string-array params
export function stringArraySerialize(value: string[] | null | undefined): string | null {
	if (!value || value.length === 0) return null;
	return value.join(',');
}

export function stringArrayDeserialize(raw: string): string[] | null {
	if (!raw) return null;
	return raw.split(',').map(s => s.trim()).filter(Boolean);
}


