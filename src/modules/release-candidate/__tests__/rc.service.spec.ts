import { ReleaseCandidateService } from '../rc.service';

describe('ReleaseCandidateService', () => {
  it('exposes an RC package without approving production release', () => {
    const service = new ReleaseCandidateService();

    const result = service.publicPackage();

    expect(result.data).toEqual(
      expect.objectContaining({
        package_version: 'm11-rc-preparation-2026-07-15',
        status: 'RELEASE_CANDIDATE_PREPARED',
        production_release: false,
        merge_to_main_approved: false,
        legal_final_judgment: false,
      }),
    );
    expect(result.data.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'full_regression', status: 'PASS_LOCAL' }),
        expect.objectContaining({
          key: 'beta_evidence',
          status: 'TECHNICAL_LOOP_READY_EXTERNAL_EVIDENCE_REQUIRED',
        }),
      ]),
    );
    expect(result.data.human_actions_required).toContain('Formal production release approval.');
  });
});
