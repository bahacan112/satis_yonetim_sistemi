-- scripts/129-drop-dependent-views-before-satislar-detay.sql
-- Drop views that depend on satislar_detay_view before modifying it.

DROP VIEW IF EXISTS public.magaza_muhasebe_summary_view;
-- Add any other views that depend on satislar_detay_view here if necessary
