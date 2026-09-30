/*
# Revoke EXECUTE on SECURITY DEFINER functions

## Overview
The security linter flagged that is_teacher() and handle_new_user() are callable
by anon and authenticated roles via the REST API. These functions are internal —
they should only be called by RLS policies and the trigger, not directly via RPC.

## Changes
1. Revoke EXECUTE on is_teacher() from anon and authenticated (keep it callable
   from policies, which run as the table owner).
2. Revoke EXECUTE on handle_new_user() from anon and authenticated (only the
   trigger should call it).
*/

REVOKE EXECUTE ON FUNCTION public.is_teacher() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;