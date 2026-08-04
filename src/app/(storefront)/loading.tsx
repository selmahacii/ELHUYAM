import React from "react";

// Returning null let <main> collapse to zero height while the route segment
// streams in, so the Footer (outside the Suspense boundary, part of the
// persistent layout) briefly jumped up right under the navbar until content
// arrived. A transparent min-height placeholder keeps <main> occupying its
// normal space with no visible loading UI, so the footer stays put.
export default function StorefrontLoading() {
  return <div className="min-h-[70vh]" />;
}
