# Initial import setup

Bootstrap verification succeeds, including dependency installation and the live
Next.js preview.

The generated Payload deployment scripts use the supported `.next` output and
`aws/lambda/nextjs` adapter contract. Both `figma make verify-deploy-preview`
and `figma make verify-deploy` currently stop during `payload build` because
the Make lifecycle does not provide its platform-owned `FIGMA_EID`.

Do not add a placeholder or user-managed value for this variable. The Payload
backend/environment must be connected by the Figma Make platform, then both
verifiers should be rerun.
