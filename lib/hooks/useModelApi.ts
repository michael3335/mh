"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModelsContext } from "@/components/models/ModelsShell";

type ValidateResponse = (res: Response) => Promise<void> | void;
type Parser<T> = (res: Response) => Promise<T>;

const defaultValidateResponse: ValidateResponse = async (res) => {
    if (res.ok) return;
    const clone = res.clone();
    const text = await clone.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
};

const defaultParser: Parser<unknown> = async (res) => res.json();

export type UseModelApiOptions<T> = {
    enabled?: boolean;
    immediate?: boolean;
    refreshIntervalMs?: number;
    parser?: Parser<T>;
    validateResponse?: ValidateResponse;
    requestInit?: RequestInit;
    onSuccess?: (data: T) => void;
    suppressToast?: boolean;
};

type UseModelApiResult<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<T | null>;
};

export function useModelApi<T>(path: string | null, options: UseModelApiOptions<T> = {}): UseModelApiResult<T> {
    const { notify } = useModelsContext();
    const {
        enabled = true,
        immediate = true,
        refreshIntervalMs,
        parser,
        validateResponse,
        requestInit,
        onSuccess,
        suppressToast = false,
    } = options;

    const effectiveParser = useMemo<Parser<T>>(() => {
        if (parser) return parser;
        return defaultParser as Parser<T>;
    }, [parser]);

    const effectiveValidator = useMemo<ValidateResponse>(() => {
        if (validateResponse) return validateResponse;
        return defaultValidateResponse;
    }, [validateResponse]);

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState<string | null>(null);
    const lastErrorRef = useRef<{ message: string; at: number } | null>(null);

    const fetchOnce = useCallback(async () => {
        if (!enabled || !path) return null;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(path, { cache: "no-store", ...requestInit });
            await effectiveValidator(res);
            const payload = await effectiveParser(res);
            setData(payload);
            onSuccess?.(payload);
            return payload;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Request failed";
            setError(message);
            if (!suppressToast) {
                const now = Date.now();
                const last = lastErrorRef.current;
                if (!last || last.message !== message || now - last.at > 5000) {
                    notify({ tone: "error", message });
                    lastErrorRef.current = { message, at: now };
                }
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [enabled, path, requestInit, effectiveValidator, effectiveParser, onSuccess, notify, suppressToast]);

    useEffect(() => {
        if (!immediate) return;
        fetchOnce();
    }, [fetchOnce, immediate]);

    useEffect(() => {
        if (!refreshIntervalMs || !enabled) return;
        const id = window.setInterval(() => {
            fetchOnce();
        }, refreshIntervalMs);
        return () => window.clearInterval(id);
    }, [refreshIntervalMs, enabled, fetchOnce]);

    return { data, loading, error, refetch: fetchOnce };
}
