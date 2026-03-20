"""Shared test fixtures."""

import pytest
from click.testing import CliRunner


@pytest.fixture
def runner():
    """CliRunner for isolated CLI testing with separate stdout/stderr assertions.

    In click 8.2+, mix_stderr was removed; stderr is always captured separately
    in result.stderr and result.stdout. result.output still mixes both streams.
    Use result.stdout for pure stdout assertions.
    """
    return CliRunner()
